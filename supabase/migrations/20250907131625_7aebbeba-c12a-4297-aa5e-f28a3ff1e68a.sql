-- Update trial email templates to reflect the actual offer: one plan + token packs

-- Update trial welcome email
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Your Free Trial</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f5518d, #cc116c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .highlight { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #078e92; }
        .cta-button { background: linear-gradient(135deg, #f5518d, #cc116c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px; }
        h2 { color: #f5518d; }
        h3 { color: #078e92; margin-top: 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 28px;">Welcome to PinkWizard!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Your 14-day free trial starts now</p>
    </div>
    
    <div class="content">
        <p>Hi {{user_name}},</p>
        
        <p>🎉 Welcome to PinkWizard! Your 14-day free trial is now active, giving you full access to our networking platform plus <strong>1,500 AI tokens</strong> to test our powerful outreach features.</p>
        
        <h2>What you can do during your trial:</h2>
        <ul style="padding-left: 20px;">
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
        
        <p><strong>After your trial:</strong> Continue with our full platform subscription, and purchase additional AI token packs as needed for your outreach volume.</p>
        
        <p>Questions? Reply to this email - we''re here to help you succeed!</p>
        
        <p>Best regards,<br>The PinkWizard Team</p>
    </div>
</body>
</html>',
subject = 'Welcome to your 14-day free trial!'
WHERE template_key = 'trial_welcome';

-- Update trial day 7 check-in email
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How''s Your First Week Going?</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #078e92, #187187); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .highlight { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #078e92; }
        .success-story { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f09300; }
        .cta-button { background: linear-gradient(135deg, #c7d368, #72d368); color: #00343a; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        h3 { margin-top: 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 28px;">Week 1 Complete! 🎯</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">7 days left in your trial</p>
    </div>
    
    <div class="content">
        <p>Hi {{user_name}},</p>
        
        <p>You''re halfway through your PinkWizard trial! How are you finding the platform so far?</p>
        
        <div class="highlight">
            <h3 style="color: #078e92;">📊 Making the Most of Your Remaining Time</h3>
            <p>With 7 days left, here''s how to maximize your trial:</p>
            <ul style="margin-bottom: 0;">
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
        
        <p><strong>Planning ahead:</strong> After your trial, you can continue with our platform subscription and add AI token packs based on your outreach needs. No complicated plan tiers - just one powerful platform with flexible AI usage.</p>
        
        <p>Need help getting the most from your trial? Just reply to this email - we''re here to support your success!</p>
        
        <p>Keep networking,<br>The PinkWizard Team</p>
    </div>
</body>
</html>'
WHERE template_key = 'trial_day_7_checkin';

-- Update trial day 12 urgency email  
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Only 2 Days Left in Your Trial</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fd6484, #f09300); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .warning { background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #cc116c; }
        .benefit { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c7d368; }
        .cta-button { background: linear-gradient(135deg, #f5518d, #cc116c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px; }
        h3 { margin-top: 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 28px;">⏰ Only 2 Days Left!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Don''t lose access to your network</p>
    </div>
    
    <div class="content">
        <p>Hi {{user_name}},</p>
        
        <p>Your PinkWizard trial expires in just <strong>2 days</strong>. Don''t lose access to all the valuable networking data and relationships you''ve built!</p>
        
        <div class="warning">
            <h3 style="color: #cc116c;">⚠️ What happens when your trial expires:</h3>
            <ul style="margin-bottom: 0;">
                <li>You''ll lose access to your contact database</li>
                <li>Follow-up reminders will stop</li>
                <li>AI outreach generation will be disabled</li>
                <li>Revenue tracking will be unavailable</li>
            </ul>
        </div>
        
        <div class="benefit">
            <h3 style="color: #c7d368;">✅ Keep Your Momentum Going</h3>
            <p style="margin-bottom: 0;"><strong>Simple pricing, powerful results:</strong> Subscribe to our platform and purchase AI token packs as you need them. No complicated tiers - just one comprehensive networking solution that grows with your business.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/pricing" class="cta-button">Upgrade Now - Keep Your Data</a>
        </div>
        
        <p style="text-align: center; color: #065867; font-size: 14px;">Questions about pricing or AI tokens? Reply to this email and we''ll help you choose the right setup.</p>
        
        <p>Don''t let your networking progress stop here,<br>The PinkWizard Team</p>
    </div>
</body>
</html>'
WHERE template_key = 'trial_day_12_urgency';

-- Update trial expired email
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Trial Has Expired</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #00343a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #065867, #00343a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .account-status { background: linear-gradient(135deg, #fd6484, #f09300); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5518d; }
        .upgrade-section { background: linear-gradient(135deg, #078e92, #187187); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; }
        .cta-button { background: #c7d368; color: #00343a; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 18px; }
        h2 { color: #f5518d; margin-top: 0; }
        h3 { color: #078e92; margin-top: 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 28px;">Trial Expired</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">But your networking journey doesn''t have to end</p>
    </div>
    
    <div class="content">
        <p>Hi {{user_name}},</p>
        
        <p>Your 14-day PinkWizard trial has expired, but the relationships you''ve started building are too valuable to lose.</p>
        
        <div class="account-status">
            <h2>🔒 Your Account Status</h2>
            <p>Your contacts and data are safely stored, but access is currently limited. Subscribe now to restore full functionality and continue growing your business network.</p>
        </div>
        
        <div class="upgrade-section">
            <h3>🚀 Simple, Powerful Pricing</h3>
            <p>We keep it simple - one comprehensive platform subscription that includes:</p>
            <ul>
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
        
        <p style="text-align: center; color: #065867; font-size: 14px;">Questions about our pricing or AI tokens? Reply to this email and we''ll provide personalized recommendations.</p>
        
        <p>Ready to unlock your networking potential,<br>The PinkWizard Team</p>
    </div>
</body>
</html>'
WHERE template_key = 'trial_expired';