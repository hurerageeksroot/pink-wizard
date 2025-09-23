import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { addDays, addWeeks, addMonths } from 'https://esm.sh/date-fns@3.6.0';

/**
 * Determines if a contact is a demo/test contact that should be excluded from follow-up emails
 */
const isDemoContact = (contact: any): boolean => {
  if (!contact) return false;

  const email = contact.email?.toLowerCase() || '';
  const source = contact.source?.toLowerCase() || '';
  const notes = contact.notes?.toLowerCase() || '';
  const company = contact.company?.toLowerCase() || '';
  const name = contact.name?.toLowerCase() || '';

  // Check for demo indicators in email
  const emailDemoIndicators = [
    'demo', 'test', 'example.com', '@mailinator', '@10minutemail', '@guerrillamail',
    'noreply', 'no-reply', 'donotreply', '@sample', '@fake', '@dummy'
  ];

  const hasEmailDemo = emailDemoIndicators.some(indicator => email.includes(indicator));

  // Check for demo indicators in source
  const sourceDemoIndicators = ['demo', 'test', 'seed', 'sample', 'example', 'fake'];
  const hasSourceDemo = sourceDemoIndicators.some(indicator => source.includes(indicator));

  // Check for demo indicators in notes
  const notesDemoIndicators = ['demo', 'test', 'sample', 'example', 'fake', 'generated'];
  const hasNotesDemo = notesDemoIndicators.some(indicator => notes.includes(indicator));

  // Check for demo indicators in company
  const companyDemoIndicators = ['demo', 'test', 'sample', 'example', 'fake corp', 'acme corp'];
  const hasCompanyDemo = companyDemoIndicators.some(indicator => company.includes(indicator));

  // Check for demo indicators in name
  const nameDemoIndicators = ['demo', 'test user', 'sample', 'example'];
  const hasNameDemo = nameDemoIndicators.some(indicator => name.includes(indicator));

  return hasEmailDemo || hasSourceDemo || hasNotesDemo || hasCompanyDemo || hasNameDemo;
};

const logDemoContactExclusion = (contact: any): void => {
  console.log(`[scheduled-email-reminders] Excluding demo contact from follow-up processing:`, {
    name: contact.name,
    email: contact.email,
    source: contact.source,
    company: contact.company
  });
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[scheduled-email-reminders] Starting scheduled reminder check');

    // Get all users with active CRM settings
    const { data: crmSettings } = await supabase
      .from('crm_settings')
      .select('user_id, auto_followup_enabled, cadences')
      .eq('auto_followup_enabled', true);

    if (!crmSettings || crmSettings.length === 0) {
      console.log('[scheduled-email-reminders] No users with auto follow-up enabled');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let totalProcessed = 0;

    for (const settings of crmSettings) {
      try {
        // Get comprehensive user data using our new function
        const { data: userData, error: userDataError } = await supabase
          .rpc('get_user_email_data', { p_user_id: settings.user_id });

        if (userDataError || !userData?.user_email) {
          console.log(`[scheduled-email-reminders] Failed to get user data for ${settings.user_id}:`, userDataError);
          continue;
        }

        const now = new Date();
        
        // Get contacts that need follow-up for this user
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', settings.user_id)
          .not('next_follow_up', 'is', null)
          .lte('next_follow_up', now.toISOString())
          .eq('archived', false);

        if (!contacts || contacts.length === 0) {
          continue;
        }

        console.log(`[scheduled-email-reminders] Found ${contacts.length} contacts needing follow-up for user ${settings.user_id}`);

        // Send follow-up reminder emails for each contact
        for (const contact of contacts) {
          // Skip demo contacts
          if (isDemoContact(contact)) {
            logDemoContactExclusion(contact);
            continue;
          }
          
          try {
            // Merge user data with contact-specific variables
            const emailVariables = {
              ...userData,
              contact_name: contact.name,
              contact_company: contact.company || 'their company',
              contact_email: contact.email,
              contact_phone: contact.phone || 'Not provided',
              contact_status: contact.status,
              last_contact_date: contact.last_contact_date || contact.created_at,
              contact_url: `${userData.app_url}/outreach?contact=${contact.id}`,
            };

            // Call the send-email function
            const { error } = await supabase.functions.invoke('send-email', {
              body: {
                templateKey: 'follow_up_reminder',
                recipientEmail: userData.user_email,
                recipientUserId: settings.user_id,
                variables: emailVariables,
                idempotencyKey: `reminder-${contact.id}-${new Date().toISOString().split('T')[0]}`
              },
            });

            if (error) {
              console.error(`[scheduled-email-reminders] Failed to send reminder for contact ${contact.id}:`, error);
              continue;
            }

            console.log(`[scheduled-email-reminders] Sent reminder for contact ${contact.name} to ${userData.user_email}`);

            // Calculate next follow-up date using the proven computeNextFollowUp logic
            const nextFollowUpDate = computeNextFollowUp(contact, settings, now);

            // Update contact with new follow-up date
            const updateData: any = {
              last_contact_date: now.toISOString()
            };

            if (nextFollowUpDate) {
              updateData.next_follow_up = nextFollowUpDate.toISOString();
            } else {
              updateData.next_follow_up = null;
            }

            await supabase
              .from('contacts')
              .update(updateData)
              .eq('id', contact.id);

            totalProcessed++;

          } catch (contactError) {
            console.error(`[scheduled-email-reminders] Error processing contact ${contact.id}:`, contactError);
          }
        }

      } catch (userError) {
        console.error(`[scheduled-email-reminders] Error processing user ${settings.user_id}:`, userError);
      }
    }

    console.log(`[scheduled-email-reminders] Processed ${totalProcessed} follow-up reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[scheduled-email-reminders] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process scheduled reminders',
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

/**
 * Compute next follow-up date based on contact and CRM settings
 * Uses the same proven logic as the frontend
 */
function computeNextFollowUp(contact: any, settings: any, fromDate: Date = new Date()): Date | null {
  const cadences = settings.cadences || {};
  
  if (!settings.auto_followup_enabled) {
    return null;
  }

  let cadenceRule: any = null;

  // Priority order: Relationship rules first, then status rules, then fallback
  // 1. Check relationship-based cadences first (this is the primary logic)
  if (contact.relationship_type && cadences.relationship?.[contact.relationship_type]) {
    const relationshipRule = cadences.relationship[contact.relationship_type];
    if (relationshipRule.enabled) {
      cadenceRule = relationshipRule;
    }
  }

  // 2. If no enabled relationship rule, check status-based cadences
  if (!cadenceRule && contact.status && cadences.status?.[contact.status]) {
    const statusRule = cadences.status[contact.status];
    if (statusRule.enabled) {
      cadenceRule = statusRule;
    }
  }

  // 3. If still no rule, use fallback
  if (!cadenceRule) {
    cadenceRule = cadences.fallback;
  }

  // If fallback is also disabled, return null
  // Note: Allow value of 0 for "Today" cadences
  if (!cadenceRule?.enabled || cadenceRule.value === undefined || cadenceRule.value === null || !cadenceRule.unit) {
    return null;
  }

  // Calculate the next follow-up date using date-fns for reliability
  switch (cadenceRule.unit) {
    case 'days':
      // If value is 0, return today (same date)
      return cadenceRule.value === 0 ? fromDate : addDays(fromDate, cadenceRule.value);
    case 'weeks':
      return addWeeks(fromDate, cadenceRule.value);
    case 'months':
      return addMonths(fromDate, cadenceRule.value);
    default:
      return null;
  }
}

serve(handler);