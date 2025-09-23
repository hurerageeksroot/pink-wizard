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

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: "No authorization provided"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid authentication token"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;

    // Check if user already has an active trial
    const { data: existingTrial } = await supabaseClient
      .from('user_trials')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingTrial) {
      return new Response(JSON.stringify({
        success: true,
        message: "Trial already active",
        trial: {
          id: existingTrial.id,
          start_date: existingTrial.trial_start_at,
          end_date: existingTrial.trial_end_at,
          status: existingTrial.status
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscribed', true)
      .maybeSingle();

    if (existingSubscription) {
      return new Response(JSON.stringify({
        success: false,
        error: "You already have an active subscription - no trial needed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if user already has valid payment access
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['paid', 'demo'])
      .gte('access_expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingPayment) {
      return new Response(JSON.stringify({
        success: false,
        error: "You already have paid access - no trial needed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if user is an active challenge participant
    const { data: challengeParticipant } = await supabaseClient
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (challengeParticipant) {
      return new Response(JSON.stringify({
        success: false,
        error: "Challenge participants are not eligible for free trials"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create new trial
    const { data: newTrial, error: trialError } = await supabaseClient
      .from('user_trials')
      .insert({
        user_id: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (trialError) {
      console.error('Trial creation error:', trialError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to create trial"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Grant 1500 AI tokens for the trial
    const { error: creditsError } = await supabaseClient
      .from('ai_credits')
      .insert({
        user_id: user.id,
        tokens_total: 1500,
        tokens_remaining: 1500,
        source: 'trial',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      });

    if (creditsError) {
      console.error('AI credits creation error:', creditsError);
      // Don't fail the trial creation if credits fail, just log it
    }

    // Trigger trial welcome email sequence
    try {
      // Get comprehensive user data from database
      const { data: userData, error: userError } = await supabaseClient.rpc('get_user_email_data', {
        p_user_id: user.id
      });

      if (userError) {
        console.error(`[start-trial] Failed to get user data for ${user.id}:`, userError);
        // Continue with basic fallback
      }

      // Enhance user data with app URL from request
      const finalVariables = {
        ...(userData || {}),
        app_url: req.headers.get("origin") || 'https://pink-wizard.com'
      };

      await supabaseClient.rpc('trigger_email_sequence', {
        event_name: 'trial_started',
        target_user_id: user.id,
        variables: finalVariables
      });

      console.log('Trial welcome email sequence triggered successfully');
    } catch (emailError) {
      console.error('Error triggering trial welcome email sequence:', emailError);
      // Don't fail trial creation if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: "14-day free trial started",
      trial: {
        id: newTrial.id,
        start_date: newTrial.trial_start_at,
        end_date: newTrial.trial_end_at,
        status: newTrial.status
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});