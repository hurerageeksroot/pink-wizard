INSERT INTO email_templates (
  template_key,
  name,
  subject,
  html_content,
  text_content,
  variables,
  description,
  is_active
) VALUES (
  'password_reset',
  'Password Reset',
  'Reset your PinkWizard password',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color:#f9f9f9; color:#00343a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="padding:30px; text-align:center; background:#f5518d; color:#ffffff;">
              <h1 style="margin:0; font-size:26px; font-family:Georgia, serif;">🔒 Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:30px; font-size:16px; line-height:1.6; color:#00343a;">
              <p>Hey <strong>{{user_name}}</strong>,</p>
              <p>We received a request to reset your password for your <strong>PinkWizard</strong> account.</p>

              <p>If you made this request, click the button below to reset your password:</p>
              
              <p style="text-align:center; margin:30px 0;">
                <a href="{{reset_link}}" style="display:inline-block; background:#f09300; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:6px; font-weight:bold; font-size:16px;">🔒 Reset Password</a>
              </p>
              
              <p style="font-size:14px; color:#666; border-left:3px solid #f5518d; padding-left:15px; margin:20px 0;">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons.
              </p>
              
              <p>If you didn''t request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

              <p style="margin-top:30px;">Stay magical,<br><strong>The PinkWizard Team</strong></p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Reset Your Password

Hey {{user_name}},

We received a request to reset your password for your PinkWizard account.

If you made this request, click the link below to reset your password:
{{reset_link}}

Important: This link will expire in 24 hours for security reasons.

If you didn''t request a password reset, you can safely ignore this email. Your password will remain unchanged.

Stay magical,
The PinkWizard Team',
  '{"user_name": "User Name", "reset_link": "Password Reset Link"}'::jsonb,
  'Sent when users request a password reset',
  true
)