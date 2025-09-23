import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeNextFollowUp } from '@/utils/followUpCadence';
import { isDemoContact, logDemoContactExclusion } from '@/utils/demoContactUtils';
import { Contact } from '@/types/crm';
import { CRMSettings } from '@/types/crmSettings';

export const useFollowUpReminders = (user: any) => {
  const queryClient = useQueryClient();
  
  const checkFollowUpReminders = async () => {
    if (!user) return;

    try {
      // Get user's profile for email notifications
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      // Try to get CRM settings from React Query cache first
      let crmSettings = queryClient.getQueryData(['crmSettings', user.id]) as CRMSettings | undefined;
      
      // If not in cache, fetch from database
      if (!crmSettings) {
        const { data: settings } = await supabase
          .from('crm_settings')
          .select('auto_followup_enabled, cadences')
          .eq('user_id', user.id)
          .single();
        
        if (!settings) return;
        
        // Convert to proper CRMSettings format
        crmSettings = {
          id: '',
          user_id: user.id,
          auto_followup_enabled: settings.auto_followup_enabled,
          cadences: settings.cadences as any,
          created_at: '',
          updated_at: ''
        };
      }

      if (!crmSettings?.auto_followup_enabled) return;

      const cadences = crmSettings.cadences || {};
      const now = new Date();

      // Get contacts that need follow-up
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .not('next_follow_up', 'is', null)
        .lte('next_follow_up', now.toISOString())
        .eq('archived', false);

      if (!contacts || contacts.length === 0) return;

      console.log(`[useFollowUpReminders] Found ${contacts.length} contacts needing follow-up`);

      // Send follow-up reminder emails
      for (const contact of contacts) {
        // Skip demo contacts
        if (isDemoContact(contact)) {
          logDemoContactExclusion(contact, 'useFollowUpReminders');
          continue;
        }
        
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              templateKey: 'follow_up_reminder',
              recipientEmail: user.email!,
              recipientUserId: user.id,
              variables: {
                user_name: profile?.display_name || user.email!.split('@')[0],
                contact_name: contact.name,
                contact_company: contact.company || 'their company',
                contact_email: contact.email,
                contact_phone: contact.phone || 'Not provided',
                contact_status: contact.status,
                last_contact_date: contact.last_contact_date || contact.created_at,
                contact_url: `${window.location.origin}/outreach?contact=${contact.id}`,
              },
            },
          });

          console.log(`[useFollowUpReminders] Sent follow-up reminder for ${contact.name}`);

          // Calculate next follow-up date using the unified cadence logic
          const contactData: Contact = {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            company: contact.company,
            status: contact.status as any,
            relationshipType: contact.relationship_type as any,
            category: contact.category || '',
            source: contact.source || '',
            createdAt: new Date(contact.created_at),
            responseReceived: contact.response_received || false,
            totalTouchpoints: contact.total_touchpoints || 0,
            bookingScheduled: contact.booking_scheduled || false,
            archived: contact.archived || false,
          };

          // Use the CRM settings we already have
          const settingsForCompute: CRMSettings = {
            id: crmSettings.id || '',
            user_id: user.id,
            auto_followup_enabled: crmSettings.auto_followup_enabled,
            cadences: crmSettings.cadences,
            created_at: crmSettings.created_at || '',
            updated_at: crmSettings.updated_at || '',
          };

          const nextFollowUpDate = computeNextFollowUp(contactData, settingsForCompute, now);

          // Update contact with new follow-up date
          if (nextFollowUpDate) {
            await supabase
              .from('contacts')
              .update({
                next_follow_up: nextFollowUpDate.toISOString(),
                last_contact_date: now.toISOString()
              })
              .eq('id', contact.id);
          } else {
            // Clear next follow-up if no cadence is enabled
            await supabase
              .from('contacts')
              .update({
                next_follow_up: null,
                last_contact_date: now.toISOString()
              })
              .eq('id', contact.id);
          }

        } catch (error) {
          console.error(`[useFollowUpReminders] Failed to send reminder for ${contact.name}:`, error);
        }
      }

    } catch (error) {
      console.error('[useFollowUpReminders] Error checking follow-up reminders:', error);
    }
  };

  const calculateNextFollowUpDate = (cadence: any): Date => {
    console.warn('[useFollowUpReminders] Using deprecated calculateNextFollowUpDate - should use computeNextFollowUp instead');
    const now = new Date();
    const value = cadence.value || 1;
    const unit = cadence.unit || 'days';

    switch (unit) {
      case 'hours':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'days':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'weeks':
        return new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
      case 'months':
        const monthsDate = new Date(now);
        monthsDate.setMonth(monthsDate.getMonth() + value);
        return monthsDate;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
    }
  };

  // Check for follow-up reminders when user is provided
  useEffect(() => {
    if (!user) return;

    // Check immediately
    checkFollowUpReminders();

    // Then check every hour
    const interval = setInterval(checkFollowUpReminders, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [user]);

  return {
    checkFollowUpReminders,
  };
};
