UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Welcome to PinkWizard</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color:#f9f9f9; color:#00343a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="padding:30px; text-align:center; background:#f5518d; color:#ffffff;">
              <h1 style="margin:0; font-size:26px; font-family:Georgia, serif;">✨ Welcome to <strong>PinkWizard</strong>! ✨</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px; font-size:16px; line-height:1.6; color:#00343a;">
              <p>Hey <strong>{{user_name}}</strong>,</p>
              <p>Welcome to the wizarding world of <strong>better relationships</strong> and <strong>bigger business</strong>! We''re thrilled you''re here.</p>

              <p>Most business owners hate cold outreach and struggle to keep in touch with their networks. We built <strong>PinkWizard</strong> to change that. Think of it as your personal magical assistant for building real, valuable connections.</p>
              
              <div style="background:#c7d368; padding:15px; border-radius:8px; margin:20px 0;">
                <p style="margin:0; font-weight:bold;">Here''s your spellbook for getting started:</p>
                <ul style="padding-left:20px; margin:10px 0;">
                  <li><strong>Set up your profile:</strong> Tell us a little about your business so we can get your magic wand ready.</li>
                  <li><strong>Import your contacts:</strong> Bring your crew into the wizarding world so you can start working your magic.</li>
                  <li><strong>Track your activities:</strong> Log your outreach and watch your network grow!</li>
                  <li><strong>Track your wins:</strong> We love a good celebration!</li>
                </ul>
              </div>

              <p style="margin:20px 0;"><strong>Ready to cast your first spell?</strong></p>
              
              <p style="text-align:center; margin:30px 0;">
                <a href="{{dashboard_url}}" style="display:inline-block; background:#f09300; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:6px; font-weight:bold; font-size:16px;">✨ Go to Dashboard ✨</a>
              </p>
              
              <p>If you have any questions or just want to say hi, reply to this email. We''re always here to help.</p>

              <p style="margin-top:30px;">To your success,<br><strong>The PinkWizard Team</strong></p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'welcome_email'