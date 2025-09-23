import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-user] Function invoked');

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[delete-user] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the requesting user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.log('[delete-user] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id_param: user.id });
    if (adminError || !isAdmin) {
      console.log('[delete-user] Admin check failed:', adminError, 'isAdmin:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get request body
    const { userId, userEmail } = await req.json();
    
    if (!userId) {
      console.log('[delete-user] Missing userId');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[delete-user] Attempting to delete user:', userId, userEmail);

    // First, clean up user data that might prevent deletion
    console.log('[delete-user] Cleaning up user data...');
    
    const tablesToCleanup = [
      'activities',
      'contacts', 
      'networking_events',
      'networking_event_contacts',
      'user_roles',
      'user_points_ledger',
      'user_badges',
      'community_posts',
      'community_comments', 
      'community_reactions',
      'community_follows',
      'community_reports',
      'user_daily_tasks',
      'user_onboarding_tasks',
      'user_weekly_tasks', 
      'user_project_goals',
      'leaderboard_stats',
      'crm_settings',
      'business_profiles',
      'email_sequence_logs',
      'email_logs',
      'ai_usage_monthly',
      'ai_credits', 
      'ai_requests_log',
      'subscribers',
      'user_challenge_progress',
      'user_metrics'
    ];
    
    // Clean up related data in batches to avoid timeout
    for (const tableName of tablesToCleanup) {
      try {
        console.log(`[delete-user] Cleaning ${tableName}...`);
        const { error } = await supabase.from(tableName).delete().eq('user_id', userId);
        if (error && !error.message.includes('does not exist')) {
          console.warn(`[delete-user] Warning cleaning ${tableName}:`, error.message);
        }
      } catch (cleanupError) {
        console.warn(`[delete-user] Failed to cleanup ${tableName}:`, cleanupError);
        // Continue with other tables
      }
    }
    
    // Finally delete the profile (should cascade from auth.users deletion, but let's be explicit)
    try {
      console.log('[delete-user] Deleting profile...');
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
        console.warn('[delete-user] Profile deletion warning:', error.message);
      }
    } catch (profileError) {
      console.warn('[delete-user] Profile deletion failed:', profileError);
    }

    console.log('[delete-user] User data cleanup completed');

    // Now try to delete the user from auth
    console.log('[delete-user] Deleting from auth.users...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('[delete-user] Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the admin action
    try {
      await supabase.rpc('log_admin_action', {
        p_action: 'delete_user',
        p_resource_type: 'user',
        p_resource_id: userId,
        p_details: { email: userEmail, deleted_by: user.id }
      });
    } catch (logError) {
      console.warn('[delete-user] Failed to log admin action:', logError);
      // Don't fail the whole operation if logging fails
    }

    console.log('[delete-user] User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[delete-user] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});