import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useEmailSequenceTriggers } from '@/hooks/useEmailSequenceTriggers';
import { useFollowUpReminders } from '@/hooks/useFollowUpReminders';
import { supabase } from '@/integrations/supabase/client';

export const EmailNotificationHandler = () => {
  const { user } = useAuth();
  const { sendRewardNotification, sendAdminNotification } = useEmailNotifications();
  const { triggerChallengeStart, triggerChallengeComplete, triggerTrialEnding } = useEmailSequenceTriggers();
  
  // Initialize follow-up reminders (automatically checks and sends follow-up emails)
  useFollowUpReminders(user);

  useEffect(() => {
    if (!user) return;

    // Handle badge earned events
    const handleBadgeEarned = async (event: CustomEvent) => {
      const { badgeId, badgeName } = event.detail;
      
      console.log(`📧 [EmailNotificationHandler] Processing badge earned event: ${badgeName}`, event.detail);
      
      try {
        // Send notification with minimal data to reduce API calls
        // Email service will fetch fresh user stats server-side
        await sendRewardNotification(
          user.email!,
          user.email!.split('@')[0], // Use email prefix as fallback
          user.id,
          badgeName,
          50, // Default badge points
          `earning the ${badgeName} badge`,
          0, // Let server fetch current total
          0, // Let server fetch current streak  
          999 // Let server fetch current rank
        );

        console.log(`✅ [EmailNotificationHandler] Sent badge notification email for ${badgeName} to ${user.email}`);
      } catch (error) {
        console.error('❌ [EmailNotificationHandler] Failed to send badge notification:', error);
      }
    };

    // Handle contact milestone events
    const handleContactMilestone = async (event: CustomEvent) => {
      const { milestone, pointsEarned } = event.detail;
      
      try {
        // Send notification with minimal data to reduce API calls
        await sendRewardNotification(
          user.email!,
          user.email!.split('@')[0], // Use email prefix as fallback
          user.id,
          `${milestone} Milestone`,
          pointsEarned,
          `reaching ${milestone}`,
          0, // Let server fetch current total
          0, // Let server fetch current streak
          999 // Let server fetch current rank
        );

        console.log(`[EmailNotificationHandler] Sent milestone notification email for ${milestone}`);
      } catch (error) {
        console.error('[EmailNotificationHandler] Failed to send milestone notification:', error);
      }
    };

    // Handle system error events for admin notifications
    const handleSystemError = async (event: CustomEvent) => {
      const { error, context } = event.detail;
      
      try {
        // Get admin users (you might want to store admin emails in settings)
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          // Get admin profiles
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id')
            .in('id', adminRoles.map(r => r.user_id));

          // Get admin auth users for email addresses
          if (adminProfiles && adminProfiles.length > 0) {
            // Send to all configured admin emails
            await sendAdminNotification(
              'System Error',
              error.message || 'An error occurred',
              user.email || 'unknown@example.com',
              user.email?.split('@')[0] || 'Unknown User',
              JSON.stringify({ error: error.message, context, timestamp: new Date().toISOString() }, null, 2)
            );
          }
        }
      } catch (notificationError) {
        console.error('[EmailNotificationHandler] Failed to send admin notification:', notificationError);
      }
    };

    // Handle challenge start events
    const handleChallengeStart = (event: CustomEvent) => {
      const { userId } = event.detail;
      triggerChallengeStart(userId || user.id);
    };

    // Handle challenge complete events
    const handleChallengeComplete = (event: CustomEvent) => {
      const { userId } = event.detail;
      triggerChallengeComplete(userId || user.id);
    };

    // Touchpoint gamification is now handled by database triggers - no need for event handling

    // Handle trial ending events
    const handleTrialEnding = (event: CustomEvent) => {
      const { userId, daysLeft } = event.detail;
      triggerTrialEnding(userId || user.id, daysLeft || 3);
    };

    // Set up event listeners
    window.addEventListener('badgeEarned', handleBadgeEarned as EventListener);
    window.addEventListener('contactMilestone', handleContactMilestone as EventListener);
    window.addEventListener('systemError', handleSystemError as EventListener);
    window.addEventListener('challengeStarted', handleChallengeStart as EventListener);
    window.addEventListener('challengeCompleted', handleChallengeComplete as EventListener);
    // touchpointLogged event listener removed - handled by database triggers
    window.addEventListener('trialEnding', handleTrialEnding as EventListener);

    return () => {
      window.removeEventListener('badgeEarned', handleBadgeEarned as EventListener);
      window.removeEventListener('contactMilestone', handleContactMilestone as EventListener);
      window.removeEventListener('systemError', handleSystemError as EventListener);
      window.removeEventListener('challengeStarted', handleChallengeStart as EventListener);
      window.removeEventListener('challengeCompleted', handleChallengeComplete as EventListener);
      // touchpointLogged event listener removed - handled by database triggers
      window.removeEventListener('trialEnding', handleTrialEnding as EventListener);
    };
  }, [user, sendRewardNotification, sendAdminNotification, triggerChallengeStart, triggerChallengeComplete, triggerTrialEnding]);

  return null; // This is a logic-only component
};

export default EmailNotificationHandler;