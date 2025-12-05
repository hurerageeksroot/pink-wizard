import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, first_name, last_name, company, position, referral_source } = await req.json();

    console.log('[join-waitlist] Processing waitlist signup:', { email, first_name, last_name });

    // Validate email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in waitlist
    const { data: existingEntry, error: checkError } = await supabase
      .from('waitlist')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[join-waitlist] Error checking existing entry:', checkError);
      throw checkError;
    }

    if (existingEntry) {
      console.log('[join-waitlist] Email already on waitlist:', existingEntry);
      return new Response(
        JSON.stringify({ 
          error: 'This email is already on the waitlist',
          status: existingEntry.status 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new waitlist entry
    const { data: newEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        company: company?.trim() || null,
        position: position?.trim() || null,
        referral_source: referral_source?.trim() || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[join-waitlist] Error inserting waitlist entry:', insertError);
      throw insertError;
    }

    console.log('[join-waitlist] Waitlist entry created:', newEntry.id);

    // Get position in queue
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('created_at', newEntry.created_at);

    // TODO: Send confirmation email via send-email function
    // For now, we'll just return success

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully joined waitlist',
        position: count || 1,
        email: newEntry.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[join-waitlist] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});