import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskCompletionRequest {
  userId: string
  taskDefinitionId: string
  challengeDay: number
  notes?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { userId, taskDefinitionId, challengeDay, notes = 'Manually completed by admin - read-only transaction fix' }: TaskCompletionRequest = await req.json()

    console.log('Admin completing daily task:', { userId, taskDefinitionId, challengeDay })

    // Call the admin function using service role
    const { data: result, error } = await supabase.rpc('admin_complete_daily_task', {
      target_user_id: userId,
      task_definition_id: taskDefinitionId,
      challenge_day_param: challengeDay,
      admin_notes: notes
    })

    if (error) {
      console.error('Error completing daily task:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Daily task completion result:', result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})