import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChangeEmailRequest {
  userId: string;
  oldEmail: string;
  newEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', {
      user_id_param: user.id
    })

    if (adminError || !adminCheck) {
      // Log unauthorized attempt
      try {
        await supabase.rpc('log_admin_action', {
          p_admin_user_id: user.id,
          p_action: 'UNAUTHORIZED_EMAIL_CHANGE_ATTEMPT',
          p_resource_type: 'user_email',
          p_resource_id: user.id,
          p_details: { attempted_by: user.email }
        })
      } catch (logError) {
        console.error('Failed to log unauthorized attempt:', logError)
      }

      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body: ChangeEmailRequest = await req.json()
    const { userId, oldEmail, newEmail } = body

    // Validate inputs
    if (!userId || !oldEmail || !newEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, oldEmail, newEmail' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if new email is already in use
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', userId)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing email:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to validate email availability' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check in auth.users as well using admin client
    const { data: authUsers, error: authCheckError } = await supabase.auth.admin.listUsers()
    
    if (authCheckError) {
      console.error('Error checking auth users:', authCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to validate email in auth system' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailInUse = authUsers.users.some(u => u.email === newEmail && u.id !== userId)
    if (emailInUse) {
      return new Response(
        JSON.stringify({ error: 'Email address is already in use' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the user exists and has the old email
    const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (targetUserError || !targetUser.user) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (targetUser.user.email !== oldEmail) {
      return new Response(
        JSON.stringify({ error: 'Current email address does not match provided old email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the user's email using admin auth
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        email: newEmail,
        email_confirm: true // Auto-confirm the new email
      }
    )

    if (updateError) {
      console.error('Error updating user email:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update email address' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the successful email change
    try {
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: user.id,
        p_action: 'EMAIL_CHANGED',
        p_resource_type: 'user_email',
        p_resource_id: userId,
        p_details: { 
          old_email: oldEmail, 
          new_email: newEmail, 
          admin_email: user.email,
          changed_at: new Date().toISOString()
        }
      })
    } catch (logError) {
      console.error('Failed to log admin action:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email address changed successfully from ${oldEmail} to ${newEmail}`,
        user: updateResult.user
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-change-email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})