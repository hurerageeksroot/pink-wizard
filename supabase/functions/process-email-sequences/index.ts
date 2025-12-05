import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log('[process-email-sequences] Starting to process scheduled email sequences...');

    // Call the database function to process scheduled emails
    const { data, error } = await supabase.rpc('process_scheduled_email_sequences');

    if (error) {
      console.error('[process-email-sequences] Database error:', error);
      throw error;
    }

    const processedCount = data || 0;
    console.log(`[process-email-sequences] Processed ${processedCount} scheduled emails`);

    // Also process pending broadcast emails (like challenge announcements)
    // Process only 5 emails per run to avoid rate limiting
    let broadcastCount = 0;
    const { data: pendingBroadcasts, error: broadcastError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('status', 'pending')
      .limit(5) // Small batch size to respect rate limits
      .order('created_at', { ascending: true }); // Process oldest first

    if (!broadcastError && pendingBroadcasts?.length > 0) {
      console.log(`[process-email-sequences] Found ${pendingBroadcasts.length} pending broadcast emails`);
      
      for (const emailLog of pendingBroadcasts) {
        try {
          // Add delay between emails to respect rate limits (1 email per second)
          if (broadcastCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 second delay
          }

          console.log(`[process-email-sequences] Sending email ${broadcastCount + 1}/${pendingBroadcasts.length} to ${emailLog.recipient_email}`);

          // Call send-email function for each pending email
          const { error: sendError } = await supabase.functions.invoke('send-email', {
            body: {
              templateKey: emailLog.template_key,
              recipientEmail: emailLog.recipient_email,
              variables: (emailLog.metadata?.variables || {}),
              idempotencyKey: `broadcast-${emailLog.id}` // Prevent duplicates
            },
            headers: {
              'X-Internal-Secret': Deno.env.get('INTERNAL_EMAIL_SECRET') || ''
            }
          });

          if (sendError) {
            console.error(`[process-email-sequences] Failed to send email to ${emailLog.recipient_email}:`, sendError);
            // Update status to failed
            await supabase
              .from('email_logs')
              .update({ status: 'failed', error_message: sendError.message })
              .eq('id', emailLog.id);
          } else {
            console.log(`[process-email-sequences] Successfully sent email to ${emailLog.recipient_email}`);
            broadcastCount++;
            // Update status to sent
            await supabase
              .from('email_logs')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', emailLog.id);
          }
        } catch (sendError: any) {
          console.error(`[process-email-sequences] Error sending to ${emailLog.recipient_email}:`, sendError);
          await supabase
            .from('email_logs')
            .update({ status: 'failed', error_message: sendError.message })
            .eq('id', emailLog.id);
        }
      }
    }

    console.log(`[process-email-sequences] Processed ${broadcastCount} broadcast emails`);

    // TEMPORARILY DISABLED: Check for inactive users to prevent email spam
    // This functionality has been disabled to prevent excessive email sending
    console.log('[process-email-sequences] Inactive user email sequences are currently disabled to prevent spam');
    
    const inactiveUsers = [];

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: processedCount,
        inactiveUsersTriggered: inactiveUsers?.length || 0,
        broadcastCount: broadcastCount,
        message: `Processed ${processedCount} scheduled emails, ${broadcastCount} broadcast emails, and triggered sequences for ${inactiveUsers?.length || 0} inactive users`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[process-email-sequences] Error:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process email sequences',
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);