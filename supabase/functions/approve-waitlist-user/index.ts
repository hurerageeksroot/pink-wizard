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

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase.rpc('is_admin', { user_id_param: user.id });
    
    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { waitlist_id, grant_trial } = await req.json();

    console.log('[approve-waitlist-user] Approving user:', { waitlist_id, grant_trial });

    // Get waitlist entry
    const { data: waitlistEntry, error: fetchError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('id', waitlist_id)
      .single();

    if (fetchError || !waitlistEntry) {
      return new Response(
        JSON.stringify({ error: 'Waitlist entry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (waitlistEntry.status === 'approved') {
      return new Response(
        JSON.stringify({ error: 'User already approved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user account
    const tempPassword = crypto.randomUUID(); // Generate temporary password
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: waitlistEntry.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: waitlistEntry.first_name,
        last_name: waitlistEntry.last_name
      }
    });

    if (createUserError) {
      console.error('[approve-waitlist-user] Error creating user:', createUserError);
      throw createUserError;
    }

    console.log('[approve-waitlist-user] User account created:', newUser.user.id);

    // Update waitlist entry
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        status: 'approved',
        invited_at: new Date().toISOString(),
        user_id: newUser.user.id
      })
      .eq('id', waitlist_id);

    if (updateError) {
      console.error('[approve-waitlist-user] Error updating waitlist:', updateError);
      throw updateError;
    }

    // Optionally grant trial access
    if (grant_trial) {
      console.log('[approve-waitlist-user] Granting trial access');
      
      // Insert trial
      const { error: trialError } = await supabase
        .from('user_trials')
        .insert({
          user_id: newUser.user.id,
          status: 'active',
          trial_start_at: new Date().toISOString(),
          trial_end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (trialError) {
        console.error('[approve-waitlist-user] Error creating trial:', trialError);
      }

      // Grant AI credits
      const { error: creditsError } = await supabase
        .from('ai_credits')
        .insert({
          user_id: newUser.user.id,
          tokens_total: 1500,
          tokens_remaining: 1500,
          source: 'trial',
          status: 'active',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (creditsError) {
        console.error('[approve-waitlist-user] Error granting AI credits:', creditsError);
      }
    }

    // Generate password reset link for user to set their own password
    const { data: resetData, error: resetError } = await supabase.auth.admin
      .generateLink({
        type: 'recovery',
        email: waitlistEntry.email,
      });

    if (resetError) {
      console.error('[approve-waitlist-user] Error generating reset link:', resetError);
    }

    // TODO: Send invitation email with reset link via send-email function

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: newUser.user.id,
        email: waitlistEntry.email,
        reset_link: resetData?.properties?.action_link || null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[approve-waitlist-user] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});