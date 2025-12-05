import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Activity {
  id: string;
  user_id: string;
  type: string;
  title: string;
  contact_id: string;
  created_at: string;
  points: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[backfill-activity-points] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('[backfill-activity-points] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc('is_admin', {
      user_id_param: user.id
    });

    if (adminError || !isAdminData) {
      console.error('[backfill-activity-points] Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[backfill-activity-points] Starting backfill process for admin:', user.email);

    // Get current challenge day
    const { data: challengeData } = await supabaseClient
      .from('challenge_config')
      .select('current_day')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const challengeDay = challengeData?.current_day || 1;
    console.log('[backfill-activity-points] Using challenge day:', challengeDay);

    // Get all activities without points (excluding demo contacts)
    const { data: activitiesData, error: activitiesError } = await supabaseClient
      .from('activities')
      .select(`
        id,
        user_id,
        type,
        title,
        contact_id,
        created_at,
        contacts!inner(is_demo)
      `)
      .eq('contacts.is_demo', false)
      .order('created_at', { ascending: true });

    if (activitiesError) {
      console.error('[backfill-activity-points] Error fetching activities:', activitiesError);
      throw activitiesError;
    }

    console.log(`[backfill-activity-points] Found ${activitiesData?.length || 0} total activities`);

    // Get points values for activity types
    const { data: pointsValues } = await supabaseClient
      .from('points_values')
      .select('activity_type, points')
      .eq('is_active', true);

    const pointsMap = new Map(
      (pointsValues || []).map(pv => [pv.activity_type, pv.points])
    );

    let processed = 0;
    let skipped = 0;
    let awarded = 0;
    const errors: string[] = [];

    // Process each activity
    for (const activity of (activitiesData || [])) {
      try {
        // Check if points already exist for this activity
        const { data: existingPoints } = await supabaseClient
          .from('user_points_ledger')
          .select('id')
          .eq('user_id', activity.user_id)
          .eq('activity_type', activity.type)
          .contains('metadata', { activity_id: activity.id })
          .limit(1);

        if (existingPoints && existingPoints.length > 0) {
          skipped++;
          continue;
        }

        // Get points for this activity type
        const points = pointsMap.get(activity.type) || 10;

        // Insert points entry
        const { error: insertError } = await supabaseClient
          .from('user_points_ledger')
          .insert({
            user_id: activity.user_id,
            activity_type: activity.type,
            points_earned: points,
            description: `Backfill: ${activity.title}`,
            metadata: {
              activity_id: activity.id,
              contact_id: activity.contact_id,
              backfilled: true,
              backfill_date: new Date().toISOString()
            },
            challenge_day: challengeDay,
            created_at: activity.created_at
          });

        if (insertError) {
          // Check if it's a unique constraint violation (acceptable to skip)
          if (insertError.code === '23505') {
            skipped++;
            continue;
          }
          
          console.error(`[backfill-activity-points] Error inserting points for activity ${activity.id}:`, insertError);
          errors.push(`Activity ${activity.id}: ${insertError.message}`);
          continue;
        }

        awarded++;
        processed++;

        // Log progress every 50 activities
        if (processed % 50 === 0) {
          console.log(`[backfill-activity-points] Progress: ${processed} processed, ${awarded} awarded, ${skipped} skipped`);
        }

      } catch (error) {
        console.error(`[backfill-activity-points] Error processing activity ${activity.id}:`, error);
        errors.push(`Activity ${activity.id}: ${error.message}`);
      }
    }

    // Update leaderboard stats after backfill
    console.log('[backfill-activity-points] Updating leaderboard stats...');
    const { error: leaderboardError } = await supabaseClient.rpc('update_leaderboard_stats');
    
    if (leaderboardError) {
      console.error('[backfill-activity-points] Error updating leaderboard:', leaderboardError);
    }

    const summary = {
      success: true,
      total_activities: activitiesData?.length || 0,
      processed,
      points_awarded: awarded,
      skipped,
      errors: errors.slice(0, 10), // Only return first 10 errors
      error_count: errors.length
    };

    console.log('[backfill-activity-points] Backfill complete:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[backfill-activity-points] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
