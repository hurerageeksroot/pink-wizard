import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  templateKey: string;
  recipientEmail: string;
  recipientUserId?: string;
  variables: Record<string, string>;
}

// Generate a unique idempotency key to prevent duplicate emails
const generateIdempotencyKey = (templateKey: string, recipientEmail: string, variables: Record<string, string>) => {
  // Create a hash-like key based on template, recipient, and key variables
  const timestamp = Date.now();
  const keyData = `${templateKey}-${recipientEmail}-${JSON.stringify(variables)}-${timestamp}`;
  return btoa(keyData).replace(/[/+=]/g, '').substring(0, 32);
};

export const useEmailNotifications = () => {
  const sendEmail = async ({ templateKey, recipientEmail, recipientUserId, variables }: SendEmailParams) => {
    try {
      const idempotencyKey = generateIdempotencyKey(templateKey, recipientEmail, variables);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          templateKey,
          recipientEmail,
          recipientUserId,
          variables,
          idempotencyKey,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  };

  const sendWelcomeEmail = async (userEmail: string, userName: string, userId: string) => {
    const dashboardUrl = `${window.location.origin}/`;
    
    // Check if welcome email was already sent to this user
    try {
      const { data: existingEmail, error: checkError } = await supabase
        .from('email_logs')
        .select('id')
        .eq('recipient_user_id', userId)
        .eq('template_key', 'welcome_email')
        .eq('status', 'sent')
        .limit(1)
        .maybeSingle();

      if (existingEmail && !checkError) {
        console.log(`[useEmailNotifications] Welcome email already sent to user ${userId}, skipping`);
        return { success: true, message: 'Email already sent' };
      }
    } catch (error) {
      // If check fails, continue with sending (better to send duplicate than miss)
      console.warn('[useEmailNotifications] Could not check existing emails, proceeding with send');
    }
    
    return sendEmail({
      templateKey: 'welcome_email',
      recipientEmail: userEmail,
      recipientUserId: userId,
      variables: {
        app_name: 'PinkWizard',
        user_name: userName || 'there',
        dashboard_url: dashboardUrl,
      },
    });
  };

  // Re-enabled welcome email listener (with proper rate limiting via send-email function)
  useEffect(() => {
    const handleWelcomeEmail = async (event: CustomEvent) => {
      const { email, userName, userId } = event.detail;
      
      try {
        await sendWelcomeEmail(email, userName, userId);
        console.log(`[useEmailNotifications] Welcome email sent to ${email}`);
      } catch (error) {
        console.error('[useEmailNotifications] Failed to send welcome email:', error);
      }
    };

    window.addEventListener('sendWelcomeEmail', handleWelcomeEmail as EventListener);
    
    return () => {
      window.removeEventListener('sendWelcomeEmail', handleWelcomeEmail as EventListener);
    };
  }, []);

  const sendRewardNotification = async (
    userEmail: string,
    userName: string,
    userId: string,
    rewardName: string,
    pointsEarned: number,
    achievementDescription: string,
    totalPoints: number,
    currentStreak: number,
    rankPosition: number
  ) => {
    const leaderboardUrl = `${window.location.origin}/leaderboard`;
    
    return sendEmail({
      templateKey: 'reward_notification',
      recipientEmail: userEmail,
      recipientUserId: userId,
      variables: {
        user_name: userName || 'there',
        reward_name: rewardName,
        points_earned: pointsEarned.toString(),
        achievement_description: achievementDescription,
        total_points: totalPoints.toString(),
        current_streak: currentStreak.toString(),
        rank_position: rankPosition.toString(),
        leaderboard_url: leaderboardUrl,
      },
    });
  };

  const sendFollowUpReminder = async (
    userEmail: string,
    userName: string,
    userId: string,
    contactName: string,
    contactCompany: string,
    contactEmail: string,
    contactPhone: string,
    contactStatus: string,
    lastContactDate: string,
    contactId: string
  ) => {
    const contactUrl = `${window.location.origin}/outreach?contact=${contactId}`;
    
    return sendEmail({
      templateKey: 'follow_up_reminder',
      recipientEmail: userEmail,
      recipientUserId: userId,
      variables: {
        user_name: userName || 'there',
        contact_name: contactName,
        contact_company: contactCompany || 'their company',
        contact_email: contactEmail,
        contact_phone: contactPhone || 'Not provided',
        contact_status: contactStatus,
        last_contact_date: lastContactDate,
        contact_url: contactUrl,
      },
    });
  };

  const sendAdminNotification = async (
    alertType: string,
    message: string,
    userEmail: string,
    userName: string,
    details: string
  ) => {
    try {
      // Get admin emails from the database
      const { data: adminEmails, error } = await supabase.rpc('get_admin_emails');
      
      if (error) {
        console.error('Error fetching admin emails:', error);
        return { error: 'Failed to fetch admin emails' };
      }

      if (!adminEmails || adminEmails.length === 0) {
        console.warn('No admin emails found');
        return { error: 'No admin emails configured' };
      }

      const adminUrl = `${window.location.origin}/admin`;

      // Send notification to all admins
      const results = await Promise.all(
        adminEmails.map((adminEmail: string) =>
          sendEmail({
            templateKey: 'admin_notification',
            recipientEmail: adminEmail,
            variables: {
              alert_type: alertType,
              message: message,
              user_email: userEmail,
              user_name: userName || 'Unknown User',
              timestamp: new Date().toISOString(),
              details: details,
              admin_url: adminUrl,
            },
          })
        )
      );

      return { success: true, results };
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { error: 'Failed to send admin notification' };
    }
  };

  // Send password reset email
  const sendPasswordResetEmail = async (userEmail: string, userName: string, resetLink: string) => {
    return sendEmail({
      templateKey: 'password_reset',
      recipientEmail: userEmail,
      variables: {
        user_name: userName || 'there',
        reset_link: resetLink
      }
    });
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendRewardNotification,
    sendFollowUpReminder,
    sendAdminNotification,
  };
};