import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/Admin/AdminLayout';
import EnhancedDashboard from '@/pages/Admin/EnhancedDashboard';
import UserManagement from '@/pages/Admin/UserManagement';
import GamificationManagement from '@/pages/Admin/GamificationManagement';
import ChallengeManagement from '@/pages/Admin/ChallengeManagement';
import EmailManagement from '@/pages/Admin/EmailManagement';
import ComprehensiveAnalytics from '@/pages/Admin/ComprehensiveAnalytics';
import ContentManagement from '@/pages/Admin/ContentManagement';
import { Settings } from '@/pages/Admin/Settings';
import ChallengeAudit from '@/pages/Admin/ChallengeAudit';
import { RelationshipStatusManager } from '@/components/Admin/RelationshipStatusManager';
import { Security } from '@/pages/Admin/Security';
import WaitlistManagement from '@/pages/Admin/WaitlistManagement';
import DataExport from '@/pages/Admin/DataExport';
import DataImport from '@/pages/Admin/DataImport';

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<EnhancedDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="gamification" element={<GamificationManagement />} />
        <Route path="challenges" element={<ChallengeManagement />} />
        <Route path="email" element={<EmailManagement />} />
        <Route path="analytics" element={<ComprehensiveAnalytics />} />
        <Route path="content" element={<ContentManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="relationships" element={<RelationshipStatusManager />} />
        <Route path="challenge-audit" element={<ChallengeAudit />} />
        <Route path="security" element={<Security />} />
        <Route path="waitlist" element={<WaitlistManagement />} />
        <Route path="data-export" element={<DataExport />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}