import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  templateKey: string;
  testUserEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { templateKey, testUserEmail }: TestEmailRequest = await req.json();

    console.log(`[test-email-variables] Testing template: ${templateKey} for user: ${testUserEmail}`);

    // Get user by email to find their ID
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to get users: ${authError.message}`);
    }

    const user = authUser.users.find(u => u.email === testUserEmail);
    if (!user) {
      throw new Error(`User with email ${testUserEmail} not found`);
    }

    // Get comprehensive user data using our new function
    const { data: userData, error: userDataError } = await supabase
      .rpc('get_user_email_data', { p_user_id: user.id });

    if (userDataError) {
      throw new Error(`Failed to get user data: ${userDataError.message}`);
    }

    console.log(`[test-email-variables] User data retrieved:`, userData);

    // Send test email with the user data
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        templateKey: templateKey,
        recipientEmail: testUserEmail,
        recipientUserId: user.id,
        variables: userData,
        idempotencyKey: `test-${templateKey}-${user.id}-${Date.now()}`
      }
    });

    if (emailError) {
      throw new Error(`Failed to send test email: ${emailError.message}`);
    }

    console.log(`[test-email-variables] Test email sent successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${testUserEmail}`,
        userData: userData,
        emailResult: emailResult
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[test-email-variables] Error:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send test email',
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);