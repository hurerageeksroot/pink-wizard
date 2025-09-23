import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for elevated privileges
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('[check-expired-trials] Starting expired trials check...');

    // Find trials that have expired but are still active
    const { data: expiredTrials, error: trialsError } = await supabaseClient
      .from('user_trials')
      .select('id, user_id, trial_end_at')
      .eq('status', 'active')
      .lt('trial_end_at', new Date().toISOString());

    if (trialsError) {
      console.error('[check-expired-trials] Error fetching expired trials:', trialsError);
      throw trialsError;
    }

    console.log(`[check-expired-trials] Found ${expiredTrials?.length || 0} expired trials`);

    if (expiredTrials && expiredTrials.length > 0) {
      // Mark trials as expired
      const trialIds = expiredTrials.map(trial => trial.id);
      
      const { error: updateError } = await supabaseClient
        .from('user_trials')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .in('id', trialIds);

      if (updateError) {
        console.error('[check-expired-trials] Error updating expired trials:', updateError);
        throw updateError;
      }

      // Expire AI credits from trial
      const userIds = expiredTrials.map(trial => trial.user_id);
      
      const { error: creditsError } = await supabaseClient
        .from('ai_credits')
        .update({ status: 'expired' })
        .in('user_id', userIds)
        .eq('source', 'trial');

      if (creditsError) {
        console.error('[check-expired-trials] Error expiring AI credits:', creditsError);
        // Don't fail the whole process if credits update fails
      }

      console.log(`[check-expired-trials] Successfully expired ${expiredTrials.length} trials`);

      // Trigger trial expired email sequence for each user
      for (const trial of expiredTrials) {
        try {
          // Get comprehensive user data from database
          const { data: userData, error: userError } = await supabaseClient.rpc('get_user_email_data', {
            p_user_id: trial.user_id
          });

          if (userError) {
            console.error(`[check-expired-trials] Failed to get user data for ${trial.user_id}:`, userError);
            // Continue with basic fallback
          }

          // Enhance user data with app URL from request
          const finalVariables = {
            ...(userData || {}),
            app_url: req.headers.get("origin") || 'https://pink-wizard.com'
          };

          await supabaseClient.rpc('trigger_email_sequence', {
            event_name: 'trial_expired',
            target_user_id: trial.user_id,
            variables: finalVariables
          });

          console.log(`[check-expired-trials] Triggered expired email for user ${trial.user_id}`);
        } catch (emailError) {
          console.error(`[check-expired-trials] Error triggering expired email for user ${trial.user_id}:`, emailError);
          // Continue with other users even if one email fails
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      expired_trials_count: expiredTrials?.length || 0,
      message: `Processed ${expiredTrials?.length || 0} expired trials`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[check-expired-trials] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});