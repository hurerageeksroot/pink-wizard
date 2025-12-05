import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log(`Enrolling user ${user.email} in challenge`);

    // Check if user is already a participant
    const { data: existingProgress } = await supabaseClient
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingProgress) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User is already enrolled in the challenge",
          alreadyEnrolled: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has inactive progress that should be reactivated
    const { data: inactiveProgress } = await supabaseClient
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .single();

    if (inactiveProgress) {
      // Reactivate existing progress
      const { error: reactivateError } = await supabaseClient
        .from('user_challenge_progress')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('id', inactiveProgress.id);

      if (reactivateError) {
        throw new Error(`Failed to reactivate challenge progress: ${reactivateError.message}`);
      }

      console.log(`Reactivated challenge progress for ${user.email}`);
    } else {
      // Enroll user in challenge with new progress record
      const { error: enrollError } = await supabaseClient
        .from('user_challenge_progress')
        .insert({
          user_id: user.id,
          joined_at: new Date().toISOString(),
          current_streak: 0,
          longest_streak: 0,
          total_days_completed: 0,
          overall_progress: 0.00,
          is_active: true
        });

      if (enrollError) {
        throw new Error(`Failed to enroll in challenge: ${enrollError.message}`);
      }
    }

    // Grant basic tier access until challenge end (Nov 22, 2025)
    const { error: subscriberError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: user.id,
        email: user.email,
        subscribed: true,
        subscription_tier: 'Basic',
        subscription_end: '2025-11-22T23:59:59Z',
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (subscriberError) {
      console.error('Failed to update subscriber status:', subscriberError);
    }

    console.log(`Successfully enrolled ${user.email} in challenge`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully enrolled in the challenge!",
        enrolled: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error enrolling in challenge:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});