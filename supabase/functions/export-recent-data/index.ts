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
    // Create anon client for token validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    // Use anon client to validate user token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Use service role client to check admin status
    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_admin', { 
      user_id_param: user.id 
    });

    if (adminError || !isAdmin) {
      console.error('[export-recent-data] Access denied - not admin');
      throw new Error('Admin access required');
    }

    const { since } = await req.json();
    const sinceTimestamp = since || '2025-10-22 11:58:30+00';

    console.log(`📦 Exporting data since: ${sinceTimestamp}`);

    // Fetch activities
    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .gte('created_at', sinceTimestamp)
      .order('created_at', { ascending: true });

    if (activitiesError) throw activitiesError;

    // Fetch new contacts
    const { data: newContacts, error: newContactsError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .gte('created_at', sinceTimestamp)
      .order('created_at', { ascending: true });

    if (newContactsError) throw newContactsError;

    // Fetch updated contacts (not newly created)
    const { data: updatedContacts, error: updatedContactsError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .gte('updated_at', sinceTimestamp)
      .lt('created_at', sinceTimestamp)
      .order('updated_at', { ascending: true });

    if (updatedContactsError) throw updatedContactsError;

    // Fetch completed daily tasks
    const { data: dailyTasks, error: dailyTasksError } = await supabaseAdmin
      .from('user_daily_tasks')
      .select('*')
      .gte('completed_at', sinceTimestamp)
      .eq('completed', true)
      .order('completed_at', { ascending: true });

    if (dailyTasksError) throw dailyTasksError;

    // Fetch completed weekly tasks
    const { data: weeklyTasks, error: weeklyTasksError } = await supabaseAdmin
      .from('user_weekly_tasks')
      .select('*')
      .gte('completed_at', sinceTimestamp)
      .eq('completed', true)
      .order('completed_at', { ascending: true });

    if (weeklyTasksError) throw weeklyTasksError;

    // Fetch points entries
    const { data: points, error: pointsError } = await supabaseAdmin
      .from('user_points_ledger')
      .select('*')
      .gte('created_at', sinceTimestamp)
      .order('created_at', { ascending: true });

    if (pointsError) throw pointsError;

    // Fetch contact research entries
    const { data: contactResearch, error: researchError } = await supabaseAdmin
      .from('contact_research')
      .select('*')
      .gte('created_at', sinceTimestamp)
      .order('created_at', { ascending: true });

    if (researchError) throw researchError;

    // Fetch contact context assignments for new/updated contacts
    const allContactIds = [
      ...newContacts.map(c => c.id),
      ...updatedContacts.map(c => c.id)
    ];

    let contextAssignments = [];
    if (allContactIds.length > 0) {
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('contact_context_assignments')
        .select(`
          *,
          contact_contexts(name, label, color_class, icon_name)
        `)
        .in('contact_id', allContactIds);

      if (!assignmentsError) {
        contextAssignments = assignments || [];
      }
    }

    const exportData = {
      export_timestamp: new Date().toISOString(),
      export_reason: 'PITR backup - preserve data before restore to 2025-10-22 11:58:30 UTC',
      data_since: sinceTimestamp,
      summary: {
        activities_count: activities?.length || 0,
        new_contacts_count: newContacts?.length || 0,
        updated_contacts_count: updatedContacts?.length || 0,
        daily_tasks_count: dailyTasks?.length || 0,
        weekly_tasks_count: weeklyTasks?.length || 0,
        points_count: points?.length || 0,
        contact_research_count: contactResearch?.length || 0,
        context_assignments_count: contextAssignments.length
      },
      activities: activities || [],
      contacts: {
        new: newContacts || [],
        updated: updatedContacts || []
      },
      tasks: {
        daily: dailyTasks || [],
        weekly: weeklyTasks || []
      },
      points: points || [],
      contact_research: contactResearch || [],
      contact_context_assignments: contextAssignments
    };

    console.log('✅ Export completed:', exportData.summary);

    return new Response(
      JSON.stringify(exportData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Export error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
