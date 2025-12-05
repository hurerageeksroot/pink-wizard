import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-send-password-reset] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing valid authorization header', success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client for token validation
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate token and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('[admin-send-password-reset] Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token', success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id_param: user.id });
    if (adminError || !isAdmin) {
      console.error('[admin-send-password-reset] Access denied - not admin:', user.email);
      
      // Log security event
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'UNAUTHORIZED_PASSWORD_RESET_EMAIL_ATTEMPT',
        resource_type: 'user_password',
        details: { attempted_by: user.email, timestamp: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required', success: false }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email }: SendPasswordResetRequest = await req.json();

    if (!email) {
      console.error('[admin-send-password-reset] Missing required parameter: email');
      throw new Error('Email is required');
    }

    console.log(`[admin-send-password-reset] Admin ${user.email} requesting password reset for: ${email}`);

    // Get user by email using listUsers
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (getUserError) {
      console.error('[admin-send-password-reset] Error fetching users:', getUserError);
      return new Response(
        JSON.stringify({ 
          error: 'An error occurred processing your request',
          code: 'OPERATION_FAILED',
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const targetUser = users.find(u => u.email === email);
    
    if (!targetUser) {
      console.error('[admin-send-password-reset] User not found:', email);
      return new Response(
        JSON.stringify({ 
          error: 'An error occurred processing your request',
          code: 'OPERATION_FAILED',
          success: false
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate password recovery link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.com')}/reset-password`
      }
    });

    if (resetError || !resetData) {
      console.error('[admin-send-password-reset] Failed to generate reset link:', resetError);
      return new Response(
        JSON.stringify({ 
          error: 'An error occurred processing your request',
          code: 'OPERATION_FAILED',
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[admin-send-password-reset] Password reset link generated successfully');

    // Get user profile for email personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', targetUser.id)
      .single();

    // Send password reset email via send-email function
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        recipientEmail: email,
        recipientUserId: targetUser.id,
        templateKey: 'password_reset',
        variables: {
          user_name: profile?.display_name || 'User',
          reset_link: resetData.properties.action_link
        },
        idempotencyKey: `password-reset-${targetUser.id}-${Date.now()}`
      }
    });

    if (emailError) {
      console.error('[admin-send-password-reset] Failed to send email:', emailError);
      return new Response(
        JSON.stringify({ 
          error: 'An error occurred processing your request',
          code: 'OPERATION_FAILED',
          success: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[admin-send-password-reset] Password reset email sent successfully to: ${email}`);

    // Log successful admin action
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'PASSWORD_RESET_EMAIL_SENT',
      resource_type: 'user_password',
      resource_id: targetUser.id,
      details: { 
        admin_email: user.email, 
        target_email: email, 
        timestamp: new Date().toISOString() 
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password reset email sent to ${email}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[admin-send-password-reset] Error:", error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to send password reset email';
    
    if (error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
      statusCode = error.message.includes('Unauthorized') ? 401 : 403;
      errorMessage = error.message;
    } else if (error.message.includes('Email is required')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('User not found')) {
      statusCode = 404;
      errorMessage = 'User not found';
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
