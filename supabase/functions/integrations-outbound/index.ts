import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Hash the token to match stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Get the token data first to access usage_count
    const { data: dbToken, error: tokenFetchError } = await supabaseClient
      .from('integration_inbound_tokens')
      .select('id, user_id, scopes, is_active, usage_count')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenFetchError || !dbToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dbToken.is_active) {
      return new Response(
        JSON.stringify({ error: 'Token is inactive' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dbToken.scopes || !dbToken.scopes.includes('outbound')) {
      return new Response(
        JSON.stringify({ error: 'Token does not have outbound permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update usage count
    await supabaseClient
      .from('integration_inbound_tokens')
      .update({ 
        usage_count: dbToken.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', dbToken.id);

    const url = new URL(req.url);
    const resource = url.searchParams.get('resource') || 'contacts';
    const since = url.searchParams.get('since');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);

    // Handle ping test (allowed before resource filtering)
    if (resource === 'ping') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connection successful',
          timestamp: new Date().toISOString(),
          user_id: dbToken.user_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resource allowlist for security
    const allowedResources = ['contacts', 'activities', 'networking_events', 'user_points_ledger'];
    
    if (!allowedResources.includes(resource)) {
      return new Response(
        JSON.stringify({ error: 'Resource not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query based on resource type
    let query = supabaseClient
      .from(resource)
      .select('*')
      .eq('user_id', dbToken.user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add since filter if provided
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the data
    return new Response(
      JSON.stringify({
        success: true,
        resource,
        count: data?.length || 0,
        data: data || [],
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});