import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  type: string;
  subject: string;
  description: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { type, subject, description, email }: FeedbackRequest = await req.json();

    if (!type || !subject || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const feedbackHtml = `
      <h2>New Feedback Submission</h2>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>User Email:</strong> ${email || 'Not provided'}</p>
      <h3>Description:</h3>
      <p>${description.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Submitted at: ${new Date().toISOString()}</small></p>
    `;

    const emailResponse = await resend.emails.send({
      from: "PinkWizard Feedback <noreply@pink-wizard.com>",
      to: ["hello@pink-wizard.com"],
      subject: `[${type.toUpperCase()}] ${subject}`,
      html: feedbackHtml,
      reply_to: email || undefined,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);