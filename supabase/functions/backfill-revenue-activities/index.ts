import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    console.log('[Backfill Revenue Activities] Starting backfill process...');

    // Get all revenue entries from user_metrics
    const { data: revenueMetrics, error: metricsError } = await supabaseClient
      .from('user_metrics')
      .select('*')
      .eq('metric_name', 'event_value')
      .order('created_at', { ascending: true });

    if (metricsError) {
      console.error('[Backfill] Error fetching revenue metrics:', metricsError);
      throw metricsError;
    }

    console.log(`[Backfill] Found ${revenueMetrics?.length || 0} revenue metrics`);

    const missingActivities = [];
    const skippedEntries = [];

    // Check each revenue metric for corresponding activity
    for (const metric of revenueMetrics || []) {
      if (!metric.contact_id) {
        console.log(`[Backfill] Skipping metric ${metric.id} - no contact_id`);
        skippedEntries.push({ metric_id: metric.id, reason: 'no_contact_id' });
        continue;
      }

      // Check for existing activity within 5 minutes of the metric creation
      const metricTime = new Date(metric.created_at);
      const fiveMinutesAfter = new Date(metricTime.getTime() + 5 * 60 * 1000);
      const fiveMinutesBefore = new Date(metricTime.getTime() - 5 * 60 * 1000);

      const { data: existingActivity, error: activityCheckError } = await supabaseClient
        .from('activities')
        .select('id')
        .eq('user_id', metric.user_id)
        .eq('contact_id', metric.contact_id)
        .eq('type', 'revenue')
        .gte('created_at', fiveMinutesBefore.toISOString())
        .lte('created_at', fiveMinutesAfter.toISOString())
        .limit(1);

      if (activityCheckError) {
        console.error('[Backfill] Error checking for existing activity:', activityCheckError);
        continue;
      }

      if (existingActivity && existingActivity.length > 0) {
        console.log(`[Backfill] Activity already exists for metric ${metric.id}`);
        skippedEntries.push({ metric_id: metric.id, reason: 'activity_exists' });
        continue;
      }

      // No activity found - this needs to be backfilled
      missingActivities.push(metric);
    }

    console.log(`[Backfill] Found ${missingActivities.length} missing activities to create`);

    const createdActivities = [];
    const errors = [];

    // Create missing activities
    for (const metric of missingActivities) {
      const revenue = metric.value || 0;
      const notes = metric.notes || '';
      
      // Parse if it's a referral from the notes
      const isReferral = notes.toLowerCase().includes('referral');
      const referredClientMatch = notes.match(/for client: (.+)/);
      const referredClient = referredClientMatch ? referredClientMatch[1] : null;

      const activityTitle = isReferral
        ? `Referral Revenue Logged: $${revenue.toLocaleString()}`
        : `Revenue Logged: $${revenue.toLocaleString()}`;

      const activityDescription = notes || (isReferral
        ? `Referral revenue of $${revenue.toLocaleString()}${referredClient ? ` for client: ${referredClient}` : ''}`
        : `Event revenue of $${revenue.toLocaleString()} logged`);

      console.log(`[Backfill] Creating activity for metric ${metric.id}`);

      const { data: newActivity, error: insertError } = await supabaseClient
        .from('activities')
        .insert({
          user_id: metric.user_id,
          contact_id: metric.contact_id,
          type: 'revenue',
          title: activityTitle,
          description: activityDescription,
          response_received: false,
          completed_at: metric.created_at, // Use the original metric timestamp
          created_at: metric.created_at, // Preserve historical timestamp
          scheduled_for: null
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Backfill] Error creating activity for metric ${metric.id}:`, insertError);
        errors.push({
          metric_id: metric.id,
          contact_id: metric.contact_id,
          error: insertError.message
        });
      } else {
        console.log(`[Backfill] ✅ Created activity ${newActivity.id} for metric ${metric.id}`);
        createdActivities.push({
          activity_id: newActivity.id,
          metric_id: metric.id,
          contact_id: metric.contact_id,
          revenue: revenue
        });
      }
    }

    const summary = {
      success: true,
      total_revenue_metrics: revenueMetrics?.length || 0,
      missing_activities_found: missingActivities.length,
      activities_created: createdActivities.length,
      skipped: skippedEntries.length,
      errors: errors.length,
      details: {
        created: createdActivities,
        skipped: skippedEntries,
        errors: errors
      }
    };

    console.log('[Backfill] Summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
