import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ACCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started - proper access control enabled");

  try {
    // Create Supabase client with anon key for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided");
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: "No authorization provided",
        requiresAuth: true,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message });
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: "Invalid authentication token",
        requiresAuth: true,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has valid access using the database function - this should handle challenge participants
    const { data: accessData, error: accessError } = await supabaseClient
      .rpc('user_can_write_secure', { user_id_param: user.id });

    if (accessError) {
      logStep("Error checking access", { error: accessError.message });
      // In case of database error, deny access for security
      return new Response(JSON.stringify({
        hasAccess: false,
        reason: "Access verification failed",
        error: accessError.message,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const hasValidAccess = accessData === true;
    
    // Always check challenge participation explicitly for better messaging
    const { data: challengeParticipant, error: challengeError } = await supabaseClient
      .rpc('user_is_challenge_participant', { user_id_param: user.id });
    
    logStep("Access and challenge check completed", { 
      hasAccess: hasValidAccess,
      isChallengeParticipant: challengeParticipant, 
      challengeError: challengeError?.message 
    });

    // Get detailed status information for better messaging
    let accessDetails = {
      hasSubscription: false,
      hasPayment: false,
      hasTrial: false,
      isChallengeParticipant: challengeParticipant === true, // Always use DB function result
      trialEndDate: null,
      challengeEndDate: null
    };

    let subscriptionTier = null;

    if (hasValidAccess) {
      // Check what type of access user has for better messaging with error handling
      try {
        const subscriptionResult = await supabaseClient.from('subscribers').select('subscribed, subscription_tier, subscription_end').eq('user_id', user.id).eq('subscribed', true).maybeSingle();
        const paymentResult = await supabaseClient.from('payments').select('access_expires_at').eq('user_id', user.id).in('status', ['paid', 'demo']).gte('access_expires_at', new Date().toISOString()).maybeSingle();
        const trialResult = await supabaseClient.rpc('user_has_active_trial', { user_id_param: user.id });
        const challengeProgressResult = await supabaseClient.from('user_challenge_progress').select('is_active').eq('user_id', user.id).eq('is_active', true).maybeSingle();
        
        const subscriptionCheck = subscriptionResult.error ? { data: null } : subscriptionResult;
        const paymentCheck = paymentResult.error ? { data: null } : paymentResult;
        const trialCheck = trialResult.error ? { data: false } : trialResult;
        const challengeProgressCheck = challengeProgressResult.error ? { data: null } : challengeProgressResult;

        // Check if challenge is currently active
        const challengeConfigResult = await supabaseClient
          .from('challenge_config')
          .select('start_date, end_date')
          .eq('is_active', true)
          .maybeSingle();

        const challengeConfig = challengeConfigResult.error ? null : challengeConfigResult.data;

        const challengeActive = challengeConfig && 
          new Date() >= new Date(challengeConfig.start_date) && 
          new Date() <= new Date(challengeConfig.end_date);

        accessDetails.hasSubscription = !!subscriptionCheck.data;
        accessDetails.hasPayment = !!paymentCheck.data;
        accessDetails.hasTrial = trialCheck.data === true;
        // Use the dedicated database function for challenge participation
        accessDetails.isChallengeParticipant = challengeParticipant === true;

        // Store subscription tier for response
        subscriptionTier = subscriptionCheck.data?.subscription_tier || null;

        // Get trial end date if has trial
        if (accessDetails.hasTrial) {
          try {
            const { data: trialData } = await supabaseClient
              .from('user_trials')
              .select('trial_end_at')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .maybeSingle();
            accessDetails.trialEndDate = trialData?.trial_end_at;
          } catch (error) {
            logStep("Error fetching trial end date", { error: error.message });
          }
        }

        // Get challenge end date if participant
        if (accessDetails.isChallengeParticipant && challengeConfig) {
          accessDetails.challengeEndDate = challengeConfig.end_date;
        }
      } catch (error) {
        logStep("Error fetching access details", { error: error.message });
        // Continue with default values
      }

      // Determine primary reason for access
      let reason = "Access granted";
      if (accessDetails.hasSubscription) {
        reason = "Active subscription";
      } else if (accessDetails.hasPayment) {
        reason = "Valid payment";
      } else if (accessDetails.hasTrial) {
        reason = "Active 14-day free trial";
      } else if (accessDetails.isChallengeParticipant) {
        reason = "Challenge participant";
      }

      return new Response(JSON.stringify({
        hasAccess: true,
        reason,
        ...accessDetails,
        subscription_tier: subscriptionTier,
        user: {
          id: user.id,
          email: user.email
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // No valid access found
    logStep("Access denied - no valid payment, subscription, trial, or challenge participation");
    return new Response(JSON.stringify({
      hasAccess: false,
      reason: "No active subscription, payment, trial, or challenge participation",
      requiresPayment: true,
      ...accessDetails,
      user: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });

  } catch (error) {
    logStep("Unexpected error", { error: error.message });
    
    // In case of unexpected error, deny access for security
    return new Response(JSON.stringify({ 
      hasAccess: false,
      reason: "Access verification system error",
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});