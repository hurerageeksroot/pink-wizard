-- Update email templates to use colors more sparingly and improve readability

-- Update account upgrade reminder template with subtle color usage
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Upgrade</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 3px solid #f5518d; }
        .content { padding: 30px; }
        .account-status {
            background: #fff8f9;
            border: 1px solid #fdd1d9;
            border-left: 4px solid #f5518d;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .upgrade-section {
            background: #f0f9fa;
            border: 1px solid #b8e6ea;
            border-left: 4px solid #078e92;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .upgrade-button {
            background: #c7d368;
            color: #2d3748;
            padding: 15px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin: 20px auto;
            text-align: center;
            border: 2px solid #a3b95a;
        }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f8f9fa; }
        h1 { color: #2d3748; margin: 0; font-size: 28px; }
        h2 { color: #f5518d; margin-top: 0; font-size: 20px; }
        h3 { color: #078e92; margin-top: 0; font-size: 18px; }
        .brand-accent { color: #f5518d; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Account Status Update</h1>
        </div>
        
        <div class="content">
            <div class="account-status">
                <h2>Your Account Status</h2>
                <p>Your contacts and data are safely stored, but access is currently limited. <span class="brand-accent">Upgrade now</span> to restore full functionality and continue growing your business network.</p>
            </div>
            
            <div class="upgrade-section">
                <h3>🚀 Simple, Powerful Access</h3>
                <p>Get back to building your network with our straightforward approach:</p>
                <ul style="margin: 15px 0;">
                    <li><strong>Platform Subscription</strong> - Full access to all networking features</li>
                    <li><strong>AI Token Packs</strong> - Purchase as needed for personalized outreach</li>
                    <li><strong>No Complex Tiers</strong> - One comprehensive solution that grows with you</li>
                </ul>
                <p><strong>Everything included:</strong> Unlimited contacts, follow-up automation, revenue tracking, and full platform access.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{upgrade_url}}" class="upgrade-button">View Pricing & Upgrade</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Questions about pricing or AI tokens? Reply to this email and we''ll help you choose the right setup.</p>
            <p><strong>Ready to unlock your networking potential,</strong><br>The PinkWizard Team</p>
        </div>
    </div>
</body>
</html>'
WHERE template_key = 'account_upgrade_reminder';

-- Update trial welcome email with cleaner design
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Your Free Trial</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 3px solid #f5518d; }
        .content { padding: 30px; }
        .highlight {
            background: #f0f9fa;
            border-left: 4px solid #078e92;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .cta-button {
            background: #f5518d;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            font-size: 16px;
        }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f8f9fa; }
        h1 { color: #2d3748; margin: 0; font-size: 28px; }
        h2 { color: #f5518d; font-size: 22px; }
        h3 { color: #078e92; margin-top: 0; }
        .brand-accent { color: #f5518d; font-weight: 600; }
        .token-highlight { background: #fff3cd; padding: 3px 8px; border-radius: 4px; color: #856404; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to PinkWizard!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; color: #666;">Your 14-day free trial starts now</p>
        </div>
        
        <div class="content">
            <p>Hi {{user_name}},</p>
            
            <p>🎉 Welcome to PinkWizard! Your 14-day free trial is now active, giving you full access to our networking platform plus <span class="token-highlight">1,500 AI tokens</span> to test our powerful outreach features.</p>
            
            <h2>What you can do during your trial:</h2>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li><strong>Track unlimited contacts</strong> - Add prospects from events, LinkedIn, and referrals</li>
                <li><strong>AI-powered outreach</strong> - Generate personalized messages with your trial tokens</li>
                <li><strong>Follow-up automation</strong> - Never miss a follow-up with smart cadences</li>
                <li><strong>Revenue tracking</strong> - Monitor your ROI and conversion rates</li>
                <li><strong>Gamified networking</strong> - Earn points and stay motivated with challenges</li>
            </ul>
            
            <div class="highlight">
                <h3>💡 Pro Tip: Start Here</h3>
                <p style="margin-bottom: 0;">Import your first contacts or add them manually, then use our AI outreach generator to create your first personalized message. This is where the magic happens!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}" class="cta-button">Start Building Your Network</a>
            </div>
            
            <p><strong>After your trial:</strong> Continue with our <span class="brand-accent">platform subscription</span> and purchase additional AI token packs as needed for your outreach volume.</p>
        </div>
        
        <div class="footer">
            <p>Questions? Reply to this email - we''re here to help you succeed!</p>
            <p><strong>Best regards,</strong><br>The PinkWizard Team</p>
        </div>
    </div>
</body>
</html>'
WHERE template_key = 'trial_welcome';

-- Update trial day 7 check-in with cleaner design
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How''s Your First Week Going?</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 3px solid #078e92; }
        .content { padding: 30px; }
        .highlight {
            background: #e8f4f6;
            border-left: 4px solid #078e92;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .success-story {
            background: #fff3cd;
            border-left: 4px solid #f09300;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .cta-button {
            background: #c7d368;
            color: #2d3748;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            border: 2px solid #a3b95a;
        }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f8f9fa; }
        h1 { color: #2d3748; margin: 0; font-size: 28px; }
        h3 { color: #078e92; margin-top: 0; }
        .brand-accent { color: #f5518d; font-weight: 600; }
        .days-left { background: #e8f4f6; padding: 3px 12px; border-radius: 15px; color: #065f65; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Week 1 Complete! 🎯</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;"><span class="days-left">7 days left</span> in your trial</p>
        </div>
        
        <div class="content">
            <p>Hi {{user_name}},</p>
            
            <p>You''re halfway through your PinkWizard trial! How are you finding the platform so far?</p>
            
            <div class="highlight">
                <h3>📊 Making the Most of Your Remaining Time</h3>
                <p>With 7 days left, here''s how to maximize your trial:</p>
                <ul style="margin-bottom: 0; line-height: 1.7;">
                    <li><strong>Set up follow-up cadences</strong> - Automate your outreach sequence</li>
                    <li><strong>Try the AI message generator</strong> - Create personalized outreach in seconds</li>
                    <li><strong>Track your first revenue</strong> - Log wins to see your ROI</li>
                    <li><strong>Import more contacts</strong> - The more data, the better insights</li>
                </ul>
            </div>
            
            <div class="success-story">
                <p style="margin: 0;"><strong>💡 Success Story:</strong> Our most successful users add at least 25 contacts and send 10+ personalized messages during their trial. You''re building valuable relationships that convert to revenue!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}" class="cta-button">Continue Building Your Network</a>
            </div>
            
            <p><strong>Planning ahead:</strong> After your trial, continue with our <span class="brand-accent">platform subscription</span> and add AI token packs based on your outreach needs. No complicated plan tiers - just one powerful platform with flexible AI usage.</p>
        </div>
        
        <div class="footer">
            <p>Need help getting the most from your trial? Just reply to this email - we''re here to support your success!</p>
            <p><strong>Keep networking,</strong><br>The PinkWizard Team</p>
        </div>
    </div>
</body>
</html>'
WHERE template_key = 'trial_day_7_checkin';

-- Update trial day 12 urgency email with cleaner design
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Only 2 Days Left in Your Trial</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 3px solid #fd6484; }
        .content { padding: 30px; }
        .warning {
            background: #ffebee;
            border: 1px solid #ffcdd2;
            border-left: 4px solid #cc116c;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .benefit {
            background: #f1f8e9;
            border: 1px solid #c8e6c9;
            border-left: 4px solid #c7d368;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .cta-button {
            background: #f5518d;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            font-size: 18px;
        }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f8f9fa; }
        h1 { color: #2d3748; margin: 0; font-size: 28px; }
        h3 { margin-top: 0; }
        .warning h3 { color: #cc116c; }
        .benefit h3 { color: #689f38; }
        .urgent-accent { color: #fd6484; font-weight: 700; }
        .days-left { background: #ffebee; padding: 3px 12px; border-radius: 15px; color: #c2185b; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Only 2 Days Left!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">Don''t lose access to your network</p>
        </div>
        
        <div class="content">
            <p>Hi {{user_name}},</p>
            
            <p>Your PinkWizard trial expires in just <span class="days-left">2 days</span>. Don''t lose access to all the valuable networking data and relationships you''ve built!</p>
            
            <div class="warning">
                <h3>⚠️ What happens when your trial expires:</h3>
                <ul style="margin-bottom: 0; line-height: 1.7;">
                    <li>You''ll lose access to your contact database</li>
                    <li>Follow-up reminders will stop</li>
                    <li>AI outreach generation will be disabled</li>
                    <li>Revenue tracking will be unavailable</li>
                </ul>
            </div>
            
            <div class="benefit">
                <h3>✅ Keep Your Momentum Going</h3>
                <p style="margin-bottom: 0;"><strong>Simple pricing, powerful results:</strong> Subscribe to our platform and purchase AI token packs as you need them. <span class="urgent-accent">No complicated tiers</span> - just one comprehensive networking solution that grows with your business.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}/pricing" class="cta-button">Upgrade Now - Keep Your Data</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Questions about pricing or AI tokens? Reply to this email and we''ll help you choose the right setup.</p>
            <p><strong>Don''t let your networking progress stop here,</strong><br>The PinkWizard Team</p>
        </div>
    </div>
</body>
</html>'
WHERE template_key = 'trial_day_12_urgency';

-- Update trial expired email with cleaner design
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Trial Has Expired</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: white; padding: 30px; text-align: center; border-bottom: 3px solid #455a64; }
        .content { padding: 30px; }
        .account-status {
            background: #fff8f9;
            border: 1px solid #fdd1d9;
            border-left: 4px solid #f5518d;
            padding: 25px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .upgrade-section {
            background: #f0f9fa;
            border: 1px solid #b8e6ea;
            border-left: 4px solid #078e92;
            padding: 25px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .cta-button {
            background: #c7d368;
            color: #2d3748;
            padding: 15px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            font-size: 18px;
            border: 2px solid #a3b95a;
        }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f8f9fa; }
        h1 { color: #2d3748; margin: 0; font-size: 28px; }
        h2 { color: #f5518d; margin-top: 0; }
        h3 { color: #078e92; margin-top: 0; }
        .brand-accent { color: #f5518d; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Trial Expired</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; color: #666;">But your networking journey doesn''t have to end</p>
        </div>
        
        <div class="content">
            <p>Hi {{user_name}},</p>
            
            <p>Your 14-day PinkWizard trial has expired, but the relationships you''ve started building are too valuable to lose.</p>
            
            <div class="account-status">
                <h2>🔒 Your Account Status</h2>
                <p>Your contacts and data are safely stored, but access is currently limited. <span class="brand-accent">Subscribe now</span> to restore full functionality and continue growing your business network.</p>
            </div>
            
            <div class="upgrade-section">
                <h3>🚀 Simple, Powerful Pricing</h3>
                <p>We keep it simple - one comprehensive platform subscription that includes:</p>
                <ul style="line-height: 1.7;">
                    <li><strong>Unlimited contacts</strong> - Store and manage all your connections</li>
                    <li><strong>Follow-up automation</strong> - Never miss an important touchpoint</li>
                    <li><strong>Revenue tracking</strong> - Monitor your networking ROI</li>
                    <li><strong>Full platform access</strong> - All features, no limitations</li>
                </ul>
                <p><strong>Plus:</strong> Purchase AI token packs as needed for personalized outreach generation - use as much or as little as your business requires.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{app_url}}/pricing" class="cta-button">View Pricing & Subscribe</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Questions about our pricing or AI tokens? Reply to this email and we''ll provide personalized recommendations.</p>
            <p><strong>Ready to unlock your networking potential,</strong><br>The PinkWizard Team</p>
        </div>
    </div>
</body>
</html>'
WHERE template_key = 'trial_expired';