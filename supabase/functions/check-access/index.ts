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
    logStep("User authenticated - granting universal access", { userId: user.id, email: user.email });

    // UNIVERSAL ACCESS MODE: All authenticated users have full write access
    // This is simplified for early-stage application with 45 users
    // No payment/subscription/trial checks needed
    
    // Optional: Check challenge participation for informational purposes only
    const { data: challengeParticipant } = await supabaseClient
      .rpc('user_is_challenge_participant', { user_id_param: user.id });

    logStep("Access granted to authenticated user", { 
      userId: user.id,
      isChallengeParticipant: challengeParticipant === true
    });

    return new Response(JSON.stringify({
      hasAccess: true,
      reason: "Authenticated user",
      hasSubscription: false, // Not checking subscriptions
      hasPayment: false, // Not checking payments
      hasTrial: false, // Not checking trials
      isChallengeParticipant: challengeParticipant === true,
      trialEndDate: null,
      challengeEndDate: null,
      subscription_tier: null,
      user: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Unexpected error", { error: error instanceof Error ? error.message : 'Unknown error' });
    
    // In case of unexpected error, deny access for security
    return new Response(JSON.stringify({ 
      hasAccess: false,
      reason: "Access verification system error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});