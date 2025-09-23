UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PinkWizard</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .gradient-header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; color: white; }
        .gradient-header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .gradient-header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; }
        .content { padding: 40px 30px; }
        .section { margin: 30px 0; }
        .section-header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; }
        .section-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
        .highlight-box { background: #fdf2f8; border: 2px solid #ec4899; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .highlight-box h3 { color: #be185d; margin: 0 0 10px 0; font-size: 18px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; }
        .feature-list li:last-child { border-bottom: none; }
        .check-icon { color: #22c55e; margin-right: 10px; font-weight: bold; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="gradient-header">
            <h1>✨ Welcome to PinkWizard! ✨</h1>
            <p>Your magical assistant for building valuable connections</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-header">
                    <h2>🎉 Welcome to the Wizarding World!</h2>
                </div>
                
                <p>Hey <strong>{{user_name}}</strong>,</p>
                
                <p>Welcome to the wizarding world of <strong>better relationships</strong> and <strong>bigger business</strong>! We''re thrilled you''re here.</p>

                <p>Most business owners hate cold outreach and struggle to keep in touch with their networks. We built <strong>PinkWizard</strong> to change that. Think of it as your personal magical assistant for building real, valuable connections.</p>
                
                <div class="highlight-box">
                    <h3>🪄 Your Spellbook for Getting Started</h3>
                    <ul class="feature-list">
                        <li><span class="check-icon">✅</span> <strong>Set up your profile:</strong> Tell us about your business so we can get your magic wand ready</li>
                        <li><span class="check-icon">✅</span> <strong>Import your contacts:</strong> Bring your crew into the wizarding world</li>
                        <li><span class="check-icon">✅</span> <strong>Track your activities:</strong> Log your outreach and watch your network grow!</li>
                        <li><span class="check-icon">✅</span> <strong>Track your wins:</strong> We love a good celebration!</li>
                    </ul>
                </div>

                <p style="text-align: center; margin: 30px 0;">
                    <a href="{{dashboard_url}}" class="cta-button">✨ Go to Dashboard ✨</a>
                </p>
                
                <p>If you have any questions or just want to say hi, reply to this email. We''re always here to help.</p>

                <p style="margin-top: 30px;">To your success,<br><strong>The PinkWizard Team</strong></p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent from PinkWizard. If you have any questions, feel free to reach out!</p>
        </div>
    </div>
</body>
</html>',
subject = 'Welcome to PinkWizard! ✨',
updated_at = now()
WHERE template_key = 'welcome_email' AND is_active = true;