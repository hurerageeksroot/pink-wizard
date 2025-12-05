import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[admin-reset-password] Missing or invalid Authorization header');
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
      console.error('[admin-reset-password] Invalid token:', authError);
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
      console.error('[admin-reset-password] Access denied - not admin:', user.email);
      
      // Log security event
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'UNAUTHORIZED_PASSWORD_RESET_ATTEMPT',
        resource_type: 'user_password',
        details: { attempted_by: user.email, timestamp: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required', success: false }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, newPassword }: ResetPasswordRequest = await req.json();

    if (!email || !newPassword) {
      console.error('[admin-reset-password] Missing required parameters');
      throw new Error('Email and newPassword are required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    console.log(`[admin-reset-password] Admin ${user.email} resetting password for: ${email}`);

    // Get user by email using listUsers with pagination
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (getUserError) {
      console.error('[admin-reset-password] Error fetching users:', getUserError);
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
      console.error('[admin-reset-password] User not found:', email);
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

    // Update user password
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id, 
      { password: newPassword }
    );

    if (updateError) {
      console.error('[admin-reset-password] Failed to update password:', updateError);
      throw updateError;
    }

    console.log(`[admin-reset-password] Password updated successfully for user: ${targetUser.id}`);

    // Log successful admin action
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
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
        message: `Password updated successfully`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[admin-reset-password] Error:", error);
    
    // Return minimal error information to prevent information disclosure
    let statusCode = 500;
    let errorMessage = 'Failed to reset password';
    
    if (error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
      statusCode = error.message.includes('Unauthorized') ? 401 : 403;
      errorMessage = error.message;
    } else if (error.message.includes('Password must')) {
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