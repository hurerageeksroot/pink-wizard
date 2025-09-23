import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useChallenge } from './useChallenge';
import { useOutreachReconciliation } from './useOutreachReconciliation';
import { useGamification } from './useGamification';
import { supabase } from '@/integrations/supabase/client';
import { sendRevenueEventToParent, getDailyRevenueTotals, getContactLifetimeValue, type RevenueLoggedEvent, type ContactWonEvent } from '@/utils/revenueSync';

interface RevenueDialogState {
  isOpen: boolean;
  contactName: string;
  contactId: string;
  contactStatus?: string;
  currentRevenue?: {
    id: string;
    amount: number;
    notes?: string;
    revenueType: 'direct' | 'referral';
    referredClient?: string;
  };
}

export function useRevenueDialog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isChallengeParticipant } = useChallenge();
  const { logOutreachActivity, getCurrentChallengeDay } = useOutreachReconciliation();
  const { triggerGamificationEvent } = useGamification();
  const [dialogState, setDialogState] = useState<RevenueDialogState>({
    isOpen: false,
    contactName: '',
    contactId: '',
    contactStatus: undefined,
    currentRevenue: undefined
  });

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('=== useRevenueDialog state changed ===', dialogState);
  }, [dialogState]);

  const openDialog = useCallback((contactName: string, contactId: string, contactStatus?: string, currentRevenue?: RevenueDialogState['currentRevenue']) => {
    console.log('=== useRevenueDialog openDialog called ===', { contactName, contactId, contactStatus, currentRevenue });
    setDialogState(prevState => {
      console.log('=== Before state update ===', prevState);
      const newState = {
        isOpen: true,
        contactName,
        contactId,
        contactStatus,
        currentRevenue
      };
      console.log('=== Setting new state ===', newState);
      return newState;
    });
    console.log('=== After state update dispatch ===');
  }, []);

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      contactName: '',
      contactId: '',
      contactStatus: undefined,
      currentRevenue: undefined
    });
  };

  // Listen for the internal event from ContactList
  React.useEffect(() => {
    const handleOpenRevenueDialog = (event: CustomEvent) => {
      const { contactName, contactId } = event.detail;
      console.log('=== useRevenueDialog received internal event ===', { contactName, contactId });
      openDialog(contactName, contactId);
    };

    console.log('=== useRevenueDialog setting up event listener ===');
    window.addEventListener('openRevenueDialogInternal', handleOpenRevenueDialog as EventListener);
    
    return () => {
      console.log('=== useRevenueDialog removing event listener ===');
      window.removeEventListener('openRevenueDialogInternal', handleOpenRevenueDialog as EventListener);
    };
  }, [openDialog]);

  const logRevenue = async (revenue: number, notes?: string, revenueType: 'direct' | 'referral' = 'direct', referredClient?: string): Promise<boolean> => {
    if (!user) return false;
    
    // Validate that we have a valid contact ID
    if (!dialogState.contactId || dialogState.contactId.trim() === '') {
      console.error('Cannot log revenue: No valid contact ID');
      toast({
        title: "Error",
        description: "Cannot log revenue: Invalid contact information.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const challengeDay = await getCurrentChallengeDay();
      
      // Log to 75 Hard app
      await logOutreachActivity('warm', 1, notes, challengeDay);
      
      // Create user metrics payload - only include contact_id if valid
      const userMetricsPayload = {
        user_id: user.id,
        metric_name: 'event_value',
        metric_type: 'currency',
        value: revenue,
        unit: 'USD',
        challenge_day: challengeDay,
        notes: `Revenue from ${dialogState.contactName}: ${notes || ''}`,
        ...(dialogState.contactId && dialogState.contactId.trim() !== '' && { contact_id: dialogState.contactId })
      };
      
      // Log revenue metric
      const { error } = await supabase
        .from('user_metrics')
        .insert(userMetricsPayload);

      if (error) {
        console.error('Error inserting user metrics:', error);
        throw error;
      }

      // Log booked events metric
      await supabase
        .from('user_metrics')
        .insert({
          user_id: user.id,
          metric_name: 'booked_events',
          metric_type: 'count',
          value: 1,
          unit: 'events',
          challenge_day: challengeDay,
          notes: `Event booked: ${dialogState.contactName}`
        });

      // Update contact's total revenue amount using lifetime value calculation
      const contactLifetimeValue = await getContactLifetimeValue(dialogState.contactId);
      
      // For direct revenue, mark contact as "won" and update revenue
      // For referral revenue, only update revenue amount
      const contactUpdate = revenueType === 'direct' 
        ? { revenue_amount: contactLifetimeValue, status: 'won' }
        : { revenue_amount: contactLifetimeValue };
        
      const { error: contactUpdateError } = await supabase
        .from('contacts')
        .update(contactUpdate)
        .eq('id', dialogState.contactId)
        .eq('user_id', user.id);

      if (contactUpdateError) {
        console.error('Error updating contact:', contactUpdateError);
        throw contactUpdateError;
      }

      // Create activity record for revenue logging
      const activityTitle = revenueType === 'direct' 
        ? `Revenue Logged: $${revenue.toLocaleString()}` 
        : `Referral Revenue Logged: $${revenue.toLocaleString()}`;
        
      const activityDescription = revenueType === 'direct'
        ? notes || `Event revenue of $${revenue.toLocaleString()} logged for ${dialogState.contactName}`
        : notes || `Referral revenue of $${revenue.toLocaleString()} generated through ${dialogState.contactName}${referredClient ? ` for client: ${referredClient}` : ''}`;

      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          contact_id: dialogState.contactId,
          type: 'revenue',
          title: activityTitle,
          description: activityDescription,
          response_received: false,
          completed_at: new Date().toISOString(),
          scheduled_for: null // Explicitly set to null to ensure it's not scheduled
        });

      if (activityError) {
        console.error('Error creating activity:', activityError);
        throw activityError;
      }

      // Trigger gamification events
      await triggerGamificationEvent('contact_won', {
        contact_id: dialogState.contactId,
        revenue,
        contact_name: dialogState.contactName
      });

      await triggerGamificationEvent('revenue_milestone', {
        revenue_amount: revenue
      });

      // Send revenue events to parent app for syncing
      const revenueLoggedEvent: RevenueLoggedEvent = {
        contactId: dialogState.contactId,
        contactName: dialogState.contactName,
        revenue,
        notes,
        challengeDay,
        timestamp: new Date().toISOString()
      };
      
      sendRevenueEventToParent(revenueLoggedEvent, 'revenue_logged');

      // Send contact won event with lifetime value
      const finalLifetimeValue = await getContactLifetimeValue(dialogState.contactId);
      const contactWonEvent: ContactWonEvent = {
        contactId: dialogState.contactId,
        contactName: dialogState.contactName,
        revenue,
        totalLifetimeValue: finalLifetimeValue,
        timestamp: new Date().toISOString()
      };
      
      sendRevenueEventToParent(contactWonEvent, 'contact_won');

      // Send updated daily revenue totals
      const dailyTotals = await getDailyRevenueTotals(challengeDay);
      if (dailyTotals) {
        sendRevenueEventToParent(dailyTotals, 'daily_revenue_update');
      }

      toast({
        title: dialogState.currentRevenue ? "Revenue Updated! 🎉" : "Revenue Logged! 🎉",
        description: `$${revenue.toLocaleString()} revenue tracked${isChallengeParticipant ? ' and synced to 75 Hard app' : ''}`,
      });

      // Trigger data refresh across the app
      window.dispatchEvent(new CustomEvent('refreshCRMData'));

      closeDialog();
      return true;
    } catch (error: any) {
      console.error('Error logging revenue:', error);
      
      // Provide more specific error messaging
      const errorMessage = error?.message?.includes('violates row-level security') 
        ? "Access denied. Please check your permissions."
        : error?.message || "Failed to log revenue. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    isOpen: dialogState.isOpen,
    contactName: dialogState.contactName,
    contactId: dialogState.contactId,
    contactStatus: dialogState.contactStatus,
    currentRevenue: dialogState.currentRevenue,
    openDialog,
    closeDialog,
    logRevenue
  };
}