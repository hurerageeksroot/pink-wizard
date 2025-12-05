import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[BUY-AI-TOKENS] Function started');

    if (!STRIPE_SECRET_KEY) {
      console.error('[BUY-AI-TOKENS] Stripe secret key not found');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user || !user.email) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[BUY-AI-TOKENS] User authenticated:', { userId: user.id, email: user.email });

    const { tokenPack } = await req.json();
    
    // Define token pack options
    const tokenPacks = {
      small: { tokens: 50000, price: 999, name: '50k AI Tokens' }, // $9.99
      medium: { tokens: 150000, price: 2499, name: '150k AI Tokens' }, // $24.99
      large: { tokens: 350000, price: 4999, name: '350k AI Tokens' }, // $49.99
      enterprise: { tokens: 1000000, price: 9999, name: '1M AI Tokens' } // $99.99
    };

    const pack = tokenPacks[tokenPack as keyof typeof tokenPacks];
    if (!pack) {
      return new Response(
        JSON.stringify({ error: 'Invalid token pack selected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    console.log('[BUY-AI-TOKENS] Creating Stripe checkout session for pack:', pack.name);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.name,
              description: `${pack.tokens.toLocaleString()} AI tokens for outreach generation`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/ai-outreach?purchase=success&tokens=${pack.tokens}`,
      cancel_url: `${req.headers.get('origin')}/ai-outreach?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        token_amount: pack.tokens.toString(),
        pack_type: tokenPack
      }
    });

    // Create pending credit record
    await supabase.from('ai_credits').insert({
      user_id: user.id,
      tokens_total: pack.tokens,
      tokens_remaining: pack.tokens,
      status: 'pending',
      source: `stripe_session_${session.id}`,
      created_at: new Date().toISOString()
    });

    console.log('[BUY-AI-TOKENS] Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        tokenPack: pack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[BUY-AI-TOKENS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});