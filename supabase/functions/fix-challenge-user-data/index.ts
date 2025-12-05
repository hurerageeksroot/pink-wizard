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

    // Get user from JWT token for authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: "No authorization header"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: "User not authenticated"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .rpc('is_admin', { user_id_param: user.id });

    if (adminError || !adminCheck) {
      return new Response(JSON.stringify({
        success: false,
        error: "Admin access required"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: "Email is required"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`[fix-challenge-user-data] Processing fix for email: ${email}`);

    // Find user by email using listUsers
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
    const targetUser = users?.find(u => u.email === email);
    
    if (listError || !targetUser) {
      return new Response(JSON.stringify({
        success: false,
        error: `User not found with email: ${email}`
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const userId = targetUser.id;
    console.log(`[fix-challenge-user-data] Found user ID: ${userId}`);

    // 1. Cancel any active trials
    const { data: cancelledTrials, error: trialError } = await supabaseClient
      .from('user_trials')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select();

    if (trialError) {
      console.error('Error cancelling trials:', trialError);
    } else {
      console.log(`[fix-challenge-user-data] Cancelled ${cancelledTrials?.length || 0} active trials`);
    }

    // 2. Expire trial AI credits
    const { data: expiredCredits, error: creditsError } = await supabaseClient
      .from('ai_credits')
      .update({ 
        status: 'expired',
        tokens_remaining: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('source', 'trial')
      .eq('status', 'active')
      .select();

    if (creditsError) {
      console.error('Error expiring AI credits:', creditsError);
    } else {
      console.log(`[fix-challenge-user-data] Expired ${expiredCredits?.length || 0} trial AI credit records`);
    }

    // 3. Upsert subscriber record with Basic tier through Nov 22, 2025
    const { data: subscriber, error: subError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: userId,
        email: email,
        subscribed: true,
        subscription_tier: 'Basic',
        subscription_end: '2025-11-22T23:59:59.000Z',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (subError) {
      console.error('Error upserting subscriber:', subError);
    } else {
      console.log(`[fix-challenge-user-data] Updated subscriber record for Basic tier through Nov 22, 2025`);
    }

    // 4. Verify user challenge progress is active
    const { data: challengeProgress, error: challengeError } = await supabaseClient
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    console.log(`[fix-challenge-user-data] Challenge participation status: ${challengeProgress ? 'Active' : 'Not Active'}`);

    return new Response(JSON.stringify({
      success: true,
      message: "User data corrected successfully",
      details: {
        cancelledTrials: cancelledTrials?.length || 0,
        expiredCredits: expiredCredits?.length || 0,
        subscriberUpdated: !!subscriber,
        challengeActive: !!challengeProgress
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