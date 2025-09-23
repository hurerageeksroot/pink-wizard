-- Update email templates to use brand colors instead of generic colors

-- Update admin notification template to use brand colors
UPDATE email_templates 
SET html_content = '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #cc116c;">⚠️ Admin Alert</h1></div><div style="background: #fef2f2; border-left: 4px solid #cc116c; padding: 20px; margin-bottom: 20px;"><h2 style="color: #cc116c; margin-top: 0;">{{alert_type}}</h2><p><strong>Message:</strong> {{message}}</p><p><strong>User:</strong> {{user_email}} ({{user_name}})</p><p><strong>Time:</strong> {{timestamp}}</p></div><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><p><strong>Additional Details:</strong></p><pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">{{details}}</pre></div><div style="text-align: center; margin: 30px 0;"><a href="{{admin_url}}" style="background: #f5518d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Admin Panel</a></div></body></html>'
WHERE template_key = 'admin_notification';

-- Update challenge welcome template with brand colors
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>75 Hard Mobile Bar Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f5518d, #cc116c); color: white; padding: 30px 20px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
        .content { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .highlight { background: #fef3f2; border-left: 4px solid #f5518d; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #078e92; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
        .footer { text-align: center; color: #065867; font-size: 14px; margin-top: 30px; }
        
        /* Enhanced header styles */
        h3 { 
            background: linear-gradient(135deg, #f5518d, #cc116c); 
            color: white; 
            padding: 15px 20px; 
            margin: 25px 0 15px 0; 
            border-radius: 8px; 
            font-size: 20px; 
            font-weight: bold;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h4 { 
            background: #078e92; 
            color: white; 
            padding: 12px 16px; 
            margin: 20px 0 10px 0; 
            border-radius: 6px; 
            font-size: 16px; 
            font-weight: bold;
        }
        
        h2 {
            color: #f5518d;
            font-size: 24px;
            font-weight: bold;
            border-bottom: 3px solid #f5518d;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .badge { background: #f09300; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        
        /* Special styling for date sections */
        .date-section {
            background: #f8fafc;
            border: 2px solid #f5518d;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .date-header {
            background: #f5518d;
            color: white;
            padding: 10px 15px;
            margin: -20px -20px 15px -20px;
            border-radius: 6px 6px 0 0;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        
        .date-icon {
            margin-right: 10px;
            font-size: 20px;
        }

        /* Account status section using brand colors */
        .account-status {
            background: linear-gradient(135deg, #fd6484, #f09300);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f5518d;
        }
        
        .upgrade-section {
            background: linear-gradient(135deg, #078e92, #187187);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .upgrade-button {
            background: #c7d368;
            color: #00343a;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
        }
    </style>
</head>'
WHERE template_key = 'challenge_welcome';

-- Create a new email template for account status/upgrade notifications using brand colors
INSERT INTO email_templates (template_key, name, subject, html_content, text_content, is_active, variables)
VALUES (
    'account_upgrade_reminder',
    'Account Upgrade Reminder',
    'Ready to unlock your networking potential?',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Upgrade</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .account-status {
            background: linear-gradient(135deg, #fd6484, #f09300);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f5518d;
        }
        .upgrade-section {
            background: linear-gradient(135deg, #078e92, #187187);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .upgrade-button {
            background: #c7d368;
            color: #00343a;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin: 20px auto;
            text-align: center;
        }
        .footer { text-align: center; color: #065867; font-size: 14px; margin-top: 30px; }
        h2 { color: #f5518d; margin-top: 0; }
        h3 { color: #078e92; margin-top: 0; }
    </style>
</head>
<body>
    <div class="account-status">
        <h2>🔒 Your Account Status</h2>
        <p>Your contacts and data are safely stored, but access is currently limited. Upgrade now to restore full functionality and continue growing your business network.</p>
    </div>
    
    <div class="upgrade-section">
        <h3>🚀 Ready to Upgrade?</h3>
        <p>Choose the plan that fits your networking goals:</p>
        <p><strong>Starter Plan</strong> - Perfect for solo entrepreneurs</p>
        <p><strong>Professional Plan</strong> - Ideal for growing businesses</p>
        <p><strong>Enterprise Plan</strong> - Built for teams and agencies</p>
        <p>All plans include unlimited contacts, AI outreach, follow-up automation, and revenue tracking.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{upgrade_url}}" class="upgrade-button">View Pricing & Upgrade</a>
        </div>
    </div>
    
    <div class="footer">
        <p>Need help choosing a plan? Reply to this email and we''ll provide personalized recommendations.</p>
        <p><strong>Ready to unlock your networking potential,</strong><br>The PinkWizard Team</p>
    </div>
</body>
</html>',
    'Your Account Status

Your contacts and data are safely stored, but access is currently limited. Upgrade now to restore full functionality and continue growing your business network.

Ready to Upgrade?

Choose the plan that fits your networking goals:
- Starter Plan - Perfect for solo entrepreneurs  
- Professional Plan - Ideal for growing businesses
- Enterprise Plan - Built for teams and agencies

All plans include unlimited contacts, AI outreach, follow-up automation, and revenue tracking.

View Pricing & Upgrade: {{upgrade_url}}

Need help choosing a plan? Reply to this email and we''ll provide personalized recommendations.

Ready to unlock your networking potential,
The PinkWizard Team',
    true,
    '{"upgrade_url": "https://app.example.com/pricing"}'
) ON CONFLICT (template_key) DO UPDATE SET
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    updated_at = now();