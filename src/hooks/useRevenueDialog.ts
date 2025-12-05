import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
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

  const openDialog = useCallback((contactName: string, contactId: string, contactStatus?: string, currentRevenue?: RevenueDialogState['currentRevenue']) => {
    setDialogState({
      isOpen: true,
      contactName,
      contactId,
      contactStatus,
      currentRevenue
    });
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
      openDialog(contactName, contactId);
    };

    window.addEventListener('openRevenueDialogInternal', handleOpenRevenueDialog as EventListener);
    
    return () => {
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
    
    const isEditing = !!dialogState.currentRevenue;
    
    try {
      const challengeDay = await getCurrentChallengeDay();
      
      // Update contact's revenue amount
      // Update contact status only (trigger will handle revenue_amount automatically)
      if (revenueType === 'direct') {
        const { error: contactUpdateError } = await supabase
          .from('contacts')
          .update({ status: 'won' })
          .eq('id', dialogState.contactId)
          .eq('user_id', user.id);

        if (contactUpdateError) {
          console.error('❌ [Revenue] Error updating contact status:', contactUpdateError);
          throw contactUpdateError;
        }
      }

      console.log('✅ [Revenue] Contact status updated');

      // Handle activity and user_metrics based on edit mode
      let activityId = dialogState.currentRevenue?.id;
      
      if (isEditing && activityId) {
        // EDITING MODE: Update activity and user_metrics directly
        await supabase
          .from('activities')
          .update({
            title: `Revenue Logged: $${revenue.toLocaleString()}`,
            description: notes || `${revenueType === 'direct' ? 'Direct' : 'Referral'} revenue logged`,
            completed_at: new Date().toISOString()
          })
          .eq('id', activityId)
          .eq('user_id', user.id);

        // Update user_metrics entry (trigger will auto-recalculate revenue_amount)
        await supabase
          .from('user_metrics')
          .update({
            value: revenue,
            metric_type: revenueType === 'direct' ? 'direct_revenue' : 'referral_revenue',
            notes: `Revenue from ${dialogState.contactName}: ${notes || ''}`,
            updated_at: new Date().toISOString()
          })
          .eq('activity_id', activityId)
          .eq('user_id', user.id)
          .eq('metric_name', 'event_value');
          
        console.log('✅ [Revenue] Updated activity and metrics (trigger will recalculate total)');
      } else {
        // NEW ENTRY MODE: Create activity and log to 75 Hard app
        await logOutreachActivity('warm', 1, notes, challengeDay);
        
        const activityTitle = revenueType === 'direct' 
          ? `Revenue Logged: $${revenue.toLocaleString()}` 
          : `Referral Revenue Logged: $${revenue.toLocaleString()}`;
          
        const activityDescription = revenueType === 'direct'
          ? notes || `Event revenue of $${revenue.toLocaleString()} logged for ${dialogState.contactName}`
          : notes || `Referral revenue of $${revenue.toLocaleString()} generated through ${dialogState.contactName}${referredClient ? ` for client: ${referredClient}` : ''}`;

        const { data: newActivity, error: activityError } = await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            contact_id: dialogState.contactId,
            type: 'revenue',
            title: activityTitle,
            description: activityDescription,
            response_received: false,
            completed_at: new Date().toISOString(),
            scheduled_for: null
          })
          .select()
          .single();

        if (activityError) {
          console.error('❌ [Revenue] Error creating activity:', activityError);
          throw activityError;
        }

        activityId = newActivity.id;
        console.log('✅ [Revenue] Activity created successfully');
        
        // Insert user_metrics for new entry (trigger will auto-calculate revenue_amount)
        const { error: metricsError } = await supabase
          .from('user_metrics')
          .insert({
            user_id: user.id,
            metric_name: 'event_value',
            metric_type: revenueType === 'direct' ? 'direct_revenue' : 'referral_revenue',
            value: revenue,
            unit: 'USD',
            challenge_day: challengeDay,
            contact_id: dialogState.contactId,
            activity_id: activityId,
            notes: `Revenue from ${dialogState.contactName}: ${notes || ''}`
          });

        if (metricsError) {
          console.error('Error inserting user metrics:', metricsError);
          throw metricsError;
        }

        // Log booked events metric (only for new entries)
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
      }
        
      console.log('✅ [Revenue] Metrics saved successfully');

      // Small delay to ensure all database writes are committed
      await new Promise(resolve => setTimeout(resolve, 150));

      // Force immediate invalidation of ALL related queries for comprehensive UI update
      console.log('🔄 [Revenue] Invalidating all related queries');
      queryClient.invalidateQueries({ 
        queryKey: ['crmData']  // Invalidate ALL crmData queries
      });
      queryClient.invalidateQueries({ 
        queryKey: ['contact-revenue'] // Invalidate ALL contact revenue
      });
      queryClient.invalidateQueries({
        queryKey: ['pointsSummary'] // Update points display
      });
      queryClient.invalidateQueries({
        queryKey: ['challengeGoals'] // Update challenge goals
      });
      console.log('✅ [Revenue] All queries invalidated - UI will refresh');

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
        description: `$${revenue.toLocaleString()} ${isEditing ? 'updated' : 'logged'} for ${dialogState.contactName}.`,
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