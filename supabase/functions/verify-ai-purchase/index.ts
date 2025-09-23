import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-AI-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");
    logStep("Session ID received", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { 
      status: session.payment_status, 
      amount: session.amount_total,
      customer: session.customer 
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        error: "Payment not completed",
        status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Determine token pack from amount
    const amount = session.amount_total || 0;
    let tokens = 0;
    let packName = 'Unknown';
    
    switch (amount) {
      case 999: // $9.99 for 15k tokens
        tokens = 15000;
        packName = 'Starter Pack';
        break;
      case 4999: // $49.99 for 100k tokens
        tokens = 100000;
        packName = 'Growth Pack';
        break;
      case 19999: // $199.99 for 500k tokens
        tokens = 500000;
        packName = 'Enterprise Pack';
        break;
      default:
        throw new Error(`Unknown token pack amount: ${amount}`);
    }
    
    logStep("Token pack determined", { amount, tokens, packName });

    // Check if credits already exist for this session
    const { data: existingCredits } = await supabaseClient
      .from('ai_credits')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', `stripe_session_${session_id}`)
      .single();

    if (existingCredits) {
      logStep("Credits already exist for this session");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Credits already activated",
        tokens 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create AI credits with 365-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);
    
    const { error: creditsError } = await supabaseClient
      .from('ai_credits')
      .insert({
        user_id: user.id,
        tokens_total: tokens,
        tokens_remaining: tokens,
        source: `stripe_session_${session_id}`,
        status: 'active',
        expires_at: expiresAt.toISOString()
      });

    if (creditsError) throw new Error(`Failed to create credits: ${creditsError.message}`);
    
    logStep("AI credits created successfully", { tokens, expires_at: expiresAt });

    return new Response(JSON.stringify({ 
      success: true,
      tokens,
      packName,
      expires_at: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-ai-purchase", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});