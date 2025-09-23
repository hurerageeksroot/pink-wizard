import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

/**
 * Determines if a contact is a demo/test contact based on email indicators
 */
const isDemoContactByEmail = (email: string): boolean => {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  const demoIndicators = [
    'demo', 'test', 'example.com', '@mailinator', '@10minutemail', '@guerrillamail',
    'noreply', 'no-reply', 'donotreply', '@sample', '@fake', '@dummy'
  ];
  
  return demoIndicators.some(indicator => lowerEmail.includes(indicator));
};

const logDemoEmailExclusion = (email: string, templateKey: string): void => {
  console.log(`[send-email] Excluding demo email from processing:`, {
    email,
    templateKey,
    reason: 'Demo contact detected'
  });
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: Track requests to avoid hitting Resend's 2 requests/second limit
const requestTimes: number[] = [];
const MAX_REQUESTS_PER_SECOND = 1; // Conservative limit to avoid 429 errors

async function rateLimitedDelay() {
  const now = Date.now();
  const oneSecondAgo = now - 1000;
  
  // Remove old timestamps
  while (requestTimes.length > 0 && requestTimes[0] < oneSecondAgo) {
    requestTimes.shift();
  }
  
  // If we've made too many requests, wait
  if (requestTimes.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestRequest = requestTimes[0];
    const waitTime = 1000 - (now - oldestRequest);
    if (waitTime > 0) {
      console.log(`[send-email] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  requestTimes.push(now);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface EmailRequest {
  templateKey: string;
  recipientEmail: string;
  recipientUserId?: string;
  variables: Record<string, string>;
  sendFrom?: string;
  idempotencyKey?: string;
}

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: Record<string, string>;
  is_active: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Security: Check for internal service authorization or admin user
    const authHeader = req.headers.get('Authorization')
    const internalSecret = req.headers.get('X-Internal-Secret')
    
    if (internalSecret !== Deno.env.get('INTERNAL_EMAIL_SECRET')) {
      // If no internal secret, require admin authentication
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing authorization' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin', { user_id_param: user.id })
      
      if (adminError || !isAdminResult) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    const {
      templateKey,
      recipientEmail,
      recipientUserId,
      variables,
      sendFrom = "PinkWizard <hello@pink-wizard.com>",
      idempotencyKey
    }: EmailRequest = await req.json();

    console.log(`[send-email] Processing email request for template: ${templateKey}, idempotency: ${idempotencyKey}`);

    // Safety check: Block follow-up reminder emails for demo contacts
    if (templateKey === 'follow_up_reminder' && isDemoContactByEmail(recipientEmail)) {
      logDemoEmailExclusion(recipientEmail, templateKey);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email blocked - demo contact detected',
          blocked: true
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check for duplicate idempotency key to prevent duplicate emails
    if (idempotencyKey) {
      const { data: existingEmail } = await supabase
        .from('email_logs')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingEmail) {
        console.log(`[send-email] Duplicate idempotency key detected: ${idempotencyKey}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email already processed',
            logId: existingEmail.id,
            duplicate: true
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Rate limiting: Check recent emails to this recipient for this template
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentEmails, error: recentError } = await supabase
      .from('email_logs')
      .select('id')
      .eq('template_key', templateKey)
      .eq('recipient_email', recipientEmail)
      .gte('created_at', fiveMinutesAgo);

    if (!recentError && recentEmails && recentEmails.length >= 3) {
      console.log(`[send-email] Rate limit exceeded for ${recipientEmail} on template ${templateKey}`);
      throw new Error(`Rate limit exceeded: Too many emails sent to ${recipientEmail} recently`);
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('[send-email] Template not found:', templateError);
      throw new Error(`Email template '${templateKey}' not found or inactive`);
    }

    const emailTemplate = template as EmailTemplate;

    // Ensure we have comprehensive user data if recipientUserId is provided
    let finalVariables = variables;
    if (recipientUserId && (!variables.user_name || variables.user_name === 'there')) {
      try {
        const { data: userData, error: userError } = await supabase.rpc('get_user_email_data', {
          p_user_id: recipientUserId
        });

        if (!userError && userData) {
          // Extract individual fields from the JSONB object
          const userDataObj = typeof userData === 'object' ? userData : JSON.parse(userData);
          const extractedUserData = {
            user_name: String(userDataObj.user_name || 'there'),
            user_email: String(userDataObj.user_email || ''),
            company_name: String(userDataObj.company_name || ''),
            location: String(userDataObj.location || ''),
            avatar_url: String(userDataObj.avatar_url || ''),
            app_url: String(userDataObj.app_url || '')
          };
          
          // Merge provided variables with fresh user data (provided variables take precedence)
          finalVariables = { ...extractedUserData, ...variables };
          console.log(`[send-email] Enhanced variables with user data for ${recipientUserId}:`, finalVariables);
        }
      } catch (userDataError) {
        console.warn(`[send-email] Could not fetch user data for ${recipientUserId}:`, userDataError);
      }
    }

    // Replace variables in subject and content
    let subject = emailTemplate.subject;
    let htmlContent = emailTemplate.html_content;
    let textContent = emailTemplate.text_content || '';

    Object.entries(finalVariables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });

    console.log(`[send-email] Sending email to: ${recipientEmail}, Subject: ${subject}`);

    // Log email attempt
    const { data: logEntry, error: logError } = await supabase
      .from('email_logs')
      .insert({
        template_key: templateKey,
        recipient_email: recipientEmail,
        recipient_user_id: recipientUserId,
        subject: subject,
        status: 'pending',
        metadata: { variables: finalVariables, template_id: emailTemplate.id },
        idempotency_key: idempotencyKey
      })
      .select()
      .single();

    if (logError) {
      console.error('[send-email] Failed to create log entry:', logError);
      // If this fails due to duplicate idempotency key, it means another request beat us to it
      if (logError.code === '23505' && idempotencyKey) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email already processed (concurrent request)',
            duplicate: true
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      throw logError;
    }

    try {
      let emailResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        try {
          // Apply rate limiting before each attempt
          await rateLimitedDelay();
          
          console.log(`[send-email] Attempting to send email (attempt ${retryCount + 1}/${maxRetries + 1})`);
          
          // Send email using Resend
          const { data: result, error: emailError } = await resend.emails.send({
            from: sendFrom,
            to: [recipientEmail],
            subject: subject,
            html: htmlContent,
            text: textContent || undefined,
          });

          if (emailError) {
            console.error('[send-email] Resend error:', emailError);
            
            // Handle rate limiting and quota limits
            if (emailError.name === 'rate_limit_exceeded' && retryCount < maxRetries) {
              const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
              console.log(`[send-email] Rate limited, retrying in ${backoffMs}ms`);
              await sleep(backoffMs);
              retryCount++;
              continue;
            }
            
            // Don't retry on daily quota exceeded - fail fast
            if (emailError.name === 'daily_quota_exceeded') {
              console.error('[send-email] Daily quota exceeded - stopping retries');
              throw new Error('Daily email quota exceeded. Please try again tomorrow.');
            }
            
            throw emailError;
          }

          emailResult = result;
          console.log('[send-email] Email sent successfully:', emailResult);
          break;
          
        } catch (error) {
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // For other errors, also retry with backoff
          const backoffMs = Math.pow(2, retryCount) * 1000;
          console.log(`[send-email] Error occurred, retrying in ${backoffMs}ms:`, error);
          await sleep(backoffMs);
          retryCount++;
        }
      }

      // Update log with success
      if (logEntry) {
        await supabase
          .from('email_logs')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_id: emailResult.id
          })
          .eq('id', logEntry.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          emailId: emailResult.id,
          logId: logEntry?.id
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (emailError) {
      console.error('[send-email] Failed to send email:', emailError);
      
      // Update log with failure
      if (logEntry) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: emailError.message || 'Unknown error occurred'
          })
          .eq('id', logEntry.id);
      }

      throw emailError;
    }

  } catch (error: any) {
    console.error("[send-email] Error:", error);
    
    let errorMessage = 'Failed to send email';
    let userFriendlyError = errorMessage;
    
    // Handle specific Resend errors with helpful messages
    if (error.error && typeof error.error === 'string') {
      if (error.error.includes('You can only send testing emails to your own email address')) {
        userFriendlyError = 'For testing emails, you can only send to your verified Resend email address. To send to other addresses, verify your domain at resend.com/domains and update the "from" address.';
      } else if (error.error.includes('verify a domain')) {
        userFriendlyError = 'Domain verification required. Visit resend.com/domains to verify your domain and use a "from" address with your verified domain.';
      } else {
        userFriendlyError = error.error;
      }
      errorMessage = error.error;
    } else if (error.message) {
      errorMessage = error.message;
      userFriendlyError = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: userFriendlyError,
        technical_error: errorMessage,
        success: false
      }),
      {
        status: error.statusCode || 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);