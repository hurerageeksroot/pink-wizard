import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportResult {
  table: string;
  success: number;
  failed: number;
  errors?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin status
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc('is_admin');
    if (adminError || !isAdminData) {
      console.error('Admin check failed:', adminError);
      throw new Error('Unauthorized: Admin access required');
    }

    const { backupData } = await req.json();
    if (!backupData) {
      throw new Error('Missing backup data');
    }

    // Normalize data format (support both old and new formats)
    const normalizedData = backupData.data ? backupData.data : {
      activities: backupData.activities || [],
      newContacts: backupData.contacts?.new || [],
      updatedContacts: backupData.contacts?.updated || [],
      dailyTasks: backupData.tasks?.daily || [],
      weeklyTasks: backupData.tasks?.weekly || [],
      points: backupData.points || [],
      contactResearch: backupData.contact_research || [],
      contactContextAssignments: backupData.context_assignments || []
    };

    console.log('Starting import process...');
    const results: ImportResult[] = [];

    // Import order matters due to foreign key constraints
    // 1. Contacts first (both new and updated)
    console.log('Importing contacts...');
    const allContacts = [...(normalizedData.newContacts || []), ...(normalizedData.updatedContacts || [])];
    const contactResult = await importTable(
      supabaseAdmin,
      'contacts',
      allContacts,
      'id'
    );
    results.push(contactResult);

    // 2. Activities (reference contacts)
    console.log('Importing activities...');
    const activityResult = await importTable(
      supabaseAdmin,
      'activities',
      normalizedData.activities || [],
      'id'
    );
    results.push(activityResult);

    // 3. Daily Tasks
    console.log('Importing daily tasks...');
    const dailyTaskResult = await importTable(
      supabaseAdmin,
      'user_daily_tasks',
      normalizedData.dailyTasks || [],
      'id'
    );
    results.push(dailyTaskResult);

    // 4. Weekly Tasks
    console.log('Importing weekly tasks...');
    const weeklyTaskResult = await importTable(
      supabaseAdmin,
      'user_weekly_tasks',
      normalizedData.weeklyTasks || [],
      'id'
    );
    results.push(weeklyTaskResult);

    // 5. Points Ledger
    console.log('Importing points...');
    const pointsResult = await importTable(
      supabaseAdmin,
      'user_points_ledger',
      normalizedData.points || [],
      'id'
    );
    results.push(pointsResult);

    // 6. Contact Research (references contacts)
    console.log('Importing contact research...');
    const researchResult = await importTable(
      supabaseAdmin,
      'contact_research',
      normalizedData.contactResearch || [],
      'id'
    );
    results.push(researchResult);

    // 7. Contact Context Assignments (references contacts)
    console.log('Importing contact context assignments...');
    const contextResult = await importTable(
      supabaseAdmin,
      'contact_context_assignments',
      normalizedData.contactContextAssignments || [],
      'id'
    );
    results.push(contextResult);

    const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log(`Import complete: ${totalSuccess} success, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { totalSuccess, totalFailed }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function importTable(
  supabaseAdmin: any,
  tableName: string,
  records: any[],
  conflictColumn: string
): Promise<ImportResult> {
  const result: ImportResult = {
    table: tableName,
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!records || records.length === 0) {
    return result;
  }

  try {
    // Clean records - remove any nested profile/contact objects from joins
    const cleanedRecords = records.map(record => {
      const cleaned = { ...record };
      // Remove any joined data that might have been in the export
      delete cleaned.profiles;
      delete cleaned.contacts;
      delete cleaned.daily_tasks_definition;
      delete cleaned.weekly_tasks_definition;
      return cleaned;
    });

    // Use upsert with onConflict to handle duplicates
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .upsert(cleanedRecords, { 
        onConflict: conflictColumn,
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Error importing ${tableName}:`, error);
      result.failed = records.length;
      result.errors = [error.message];
    } else {
      result.success = records.length;
    }
  } catch (error: any) {
    console.error(`Exception importing ${tableName}:`, error);
    result.failed = records.length;
    result.errors = [error.message];
  }

  return result;
}
