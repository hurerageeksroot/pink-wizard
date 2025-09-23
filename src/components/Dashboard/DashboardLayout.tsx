import React, { useState, useEffect } from 'react';
import { ModernDashboard } from './ModernDashboard';
import { DailyTasks } from '@/components/DailyTasks';
import { NetworkingEvents } from '@/components/NetworkingEvents';
import { ActivitiesTable } from '@/components/ActivitiesTable';
import { PointsCard } from '@/components/PointsCard';
import { BusinessGoalsCard } from '@/components/BusinessGoalsCard';
import { ChallengeWelcomeBanner } from '@/components/ChallengeWelcomeBanner';
import { ChallengeAccessGate } from '@/components/ChallengeAccessGate';
import { CRMStats, Contact, Activity, TouchpointType } from "@/types/crm";
import type { ExternalOutreachCounts } from "@/components/ExternalCountsBridge";
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  stats: CRMStats;
  contacts: Contact[];
  activities: Activity[];
  onShowBookings?: () => void;
  externalCounts?: ExternalOutreachCounts | null;
  isEmbeddedMode?: boolean;
  onNavigateToAI?: () => void;
  onContactSelect: (contact: Contact) => void;
  onAddContact: () => void;
  onImportContacts: (importedContacts: Contact[]) => Promise<void>;
  onUpdateContactStatus: (contactId: string, status: Contact['status']) => void;
  onUpdateContactRelationship: (contactId: string, relationshipType: Contact['relationshipType']) => void;
  onToggleResponse: (contactId: string) => void;
  onToggleArchive: (contactId: string) => void;
  onDeleteContact: (contactId: string) => void;
  onAddActivity: (contactId: string, payload: {
    type: TouchpointType;
    title: string;
    description?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => void;
  onLogTouchpoint: (contact: Contact) => void;
  onActivityUpdate?: (updatedActivity: Activity) => void;
  onActivityDelete?: (activityId: string) => void;
  urlFilter: string | null;
  canWrite: boolean;
  hasRealData: boolean;
  showDemoData: boolean;
  setShowDemoData: (show: boolean) => void;
  isChallengeParticipant: boolean;
}

export function DashboardLayout({
  stats,
  contacts,
  activities,
  onShowBookings,
  externalCounts,
  isEmbeddedMode,
  onNavigateToAI,
  onContactSelect,
  onAddContact,
  onImportContacts,
  onUpdateContactStatus,
  onUpdateContactRelationship,
  onToggleResponse,
  onToggleArchive,
  onDeleteContact,
  onAddActivity,
  onLogTouchpoint,
  onActivityUpdate,
  onActivityDelete,
  urlFilter,
  canWrite,
  hasRealData,
  showDemoData,
  setShowDemoData,
  isChallengeParticipant
}: DashboardLayoutProps) {
  const location = useLocation();
  const [shouldAutoOpenGoals, setShouldAutoOpenGoals] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('goals') === 'true') {
      setShouldAutoOpenGoals(true);
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('goals');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search]);

  const handleAutoOpenHandled = () => {
    setShouldAutoOpenGoals(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Challenge Welcome Banner */}
      <ChallengeWelcomeBanner />
      
      {/* Points and Goals Cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <PointsCard />
        {isChallengeParticipant && (
          <BusinessGoalsCard 
            autoOpen={shouldAutoOpenGoals} 
            onAutoOpenHandled={handleAutoOpenHandled}
          />
        )}
      </div>

      {/* Modern Dashboard */}
      <ModernDashboard
        stats={stats}
        contacts={contacts}
        activities={activities}
        onShowBookings={onShowBookings}
        externalCounts={externalCounts}
        isEmbeddedMode={isEmbeddedMode}
        onNavigateToAI={onNavigateToAI}
        onAddContact={onAddContact}
        canWrite={canWrite}
        hasRealData={hasRealData}
        showDemoData={showDemoData}
        setShowDemoData={setShowDemoData}
        isChallengeParticipant={isChallengeParticipant}
      />

      {/* Secondary Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Tasks and Networking */}
        <div className="space-y-4 sm:space-y-6">
          <ChallengeAccessGate feature="challenge_tasks">
            {isChallengeParticipant && <DailyTasks isChallengeParticipant={isChallengeParticipant} />}
          </ChallengeAccessGate>
          <NetworkingEvents />
        </div>

        {/* Activities Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <ActivitiesTable 
            activities={activities} 
            contacts={contacts} 
            onActivityUpdate={onActivityUpdate}
            onActivityDelete={onActivityDelete}
          />
        </div>
      </div>
    </div>
  );
}