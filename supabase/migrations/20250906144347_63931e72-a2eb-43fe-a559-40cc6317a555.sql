-- Update user_can_write function to properly enforce trial and payment access
CREATE OR REPLACE FUNCTION public.user_can_write(user_id_param uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_user_id UUID;
    has_valid_payment BOOLEAN := FALSE;
    has_active_trial BOOLEAN := FALSE;
    is_challenge_participant BOOLEAN := FALSE;
BEGIN
    -- Use provided user_id or fall back to auth.uid()
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for valid payment access
    SELECT EXISTS(
        SELECT 1 
        FROM public.payments p
        WHERE p.user_id = target_user_id
          AND p.status IN ('paid', 'demo')
          AND p.access_expires_at > now()
    ) INTO has_valid_payment;
    
    -- Check for active trial
    SELECT EXISTS(
        SELECT 1 FROM user_trials 
        WHERE user_id = target_user_id 
        AND status = 'active' 
        AND trial_end_at > NOW()
    ) INTO has_active_trial;
    
    -- Check challenge participation (as backup access)
    SELECT public.user_is_challenge_participant(target_user_id) INTO is_challenge_participant;
    
    -- Grant access if any condition is met
    RETURN (has_valid_payment OR has_active_trial OR is_challenge_participant);
END;
$$;

-- Create email templates for trial nurture sequence
INSERT INTO public.email_templates (
    template_key, 
    name, 
    subject, 
    html_content, 
    text_content,
    description,
    variables
) VALUES 
(
    'trial_welcome',
    'Trial Welcome Email',
    'Welcome to your 14-day free trial!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Your Free Trial</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PinkWizard!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your 14-day free trial starts now</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi {{user_name}},</p>
        
        <p>🎉 Welcome to PinkWizard! Your 14-day free trial is now active, and you have <strong>1,500 AI tokens</strong> to explore all our powerful outreach features.</p>
        
        <h2 style="color: #667eea;">What you can do during your trial:</h2>
        <ul style="padding-left: 20px;">
            <li><strong>Track unlimited contacts</strong> - Add prospects from events, LinkedIn, and referrals</li>
            <li><strong>AI-powered outreach</strong> - Generate personalized messages with 1,500 AI tokens</li>
            <li><strong>Follow-up automation</strong> - Never miss a follow-up with smart cadences</li>
            <li><strong>Revenue tracking</strong> - Monitor your ROI and conversion rates</li>
            <li><strong>Gamified progress</strong> - Earn points and stay motivated</li>
        </ul>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">💡 Pro Tip: Start Here</h3>
            <p style="margin-bottom: 0;">Import your first contacts or add them manually, then use our AI outreach generator to create your first personalized message. This is where the magic happens!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Building Your Network</a>
        </div>
        
        <p>Questions? Reply to this email - we''re here to help you succeed!</p>
        
        <p>Best regards,<br>The PinkWizard Team</p>
    </div>
</body>
</html>',
    'Hi {{user_name}},

Welcome to PinkWizard! Your 14-day free trial is now active, and you have 1,500 AI tokens to explore all our powerful outreach features.

What you can do during your trial:
- Track unlimited contacts - Add prospects from events, LinkedIn, and referrals
- AI-powered outreach - Generate personalized messages with 1,500 AI tokens  
- Follow-up automation - Never miss a follow-up with smart cadences
- Revenue tracking - Monitor your ROI and conversion rates
- Gamified progress - Earn points and stay motivated

Pro Tip: Start by importing your first contacts or adding them manually, then use our AI outreach generator to create your first personalized message. This is where the magic happens!

Start building your network: {{app_url}}

Questions? Reply to this email - we''re here to help you succeed!

Best regards,
The PinkWizard Team',
    'Welcome email sent when users start their free trial',
    '{"user_name": "User''s display name", "app_url": "URL to the application"}'::jsonb
),
(
    'trial_day_7_checkin',
    'Trial Day 7 Check-in',
    'How''s your first week going?',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>How''s Your First Week Going?</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Week 1 Complete! 🎯</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">7 days left in your trial</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi {{user_name}},</p>
        
        <p>You''re halfway through your PinkWizard trial! How are you finding the platform so far?</p>
        
        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">📊 Making the Most of Your Remaining Time</h3>
            <p>With 7 days left, here''s how to maximize your trial:</p>
            <ul style="margin-bottom: 0;">
                <li><strong>Set up follow-up cadences</strong> - Automate your outreach sequence</li>
                <li><strong>Try the AI message generator</strong> - Create personalized outreach in seconds</li>
                <li><strong>Track your first revenue</strong> - Log wins to see your ROI</li>
                <li><strong>Import more contacts</strong> - The more data, the better insights</li>
            </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>💡 Success Story:</strong> Our most successful users add at least 25 contacts and send 10+ personalized messages during their trial. You''re building valuable relationships that convert to revenue!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Continue Building Your Network</a>
        </div>
        
        <p>Need help getting the most from your trial? Just reply to this email - we''re here to support your success!</p>
        
        <p>Keep networking,<br>The PinkWizard Team</p>
    </div>
</body>
</html>',
    'Hi {{user_name}},

You''re halfway through your PinkWizard trial! How are you finding the platform so far?

Making the Most of Your Remaining Time (7 days left):
- Set up follow-up cadences - Automate your outreach sequence  
- Try the AI message generator - Create personalized outreach in seconds
- Track your first revenue - Log wins to see your ROI
- Import more contacts - The more data, the better insights

Success Story: Our most successful users add at least 25 contacts and send 10+ personalized messages during their trial. You''re building valuable relationships that convert to revenue!

Continue building your network: {{app_url}}

Need help getting the most from your trial? Just reply to this email - we''re here to support your success!

Keep networking,
The PinkWizard Team',
    'Mid-trial check-in email sent on day 7',
    '{"user_name": "User''s display name", "app_url": "URL to the application"}'::jsonb
),
(
    'trial_day_12_urgency',
    'Trial Day 12 - 2 Days Left',  
    'Only 2 days left in your trial',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Only 2 Days Left in Your Trial</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Only 2 Days Left!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Don''t lose access to your network</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi {{user_name}},</p>
        
        <p>Your PinkWizard trial expires in just <strong>2 days</strong>. Don''t lose access to all the valuable networking data and relationships you''ve built!</p>
        
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #dc3545;">⚠️ What happens when your trial expires:</h3>
            <ul style="margin-bottom: 0;">
                <li>You''ll lose access to your contact database</li>
                <li>Follow-up reminders will stop</li>
                <li>AI outreach generation will be disabled</li>
                <li>Revenue tracking will be unavailable</li>
            </ul>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">✅ Keep Your Momentum Going</h3>
            <p style="margin-bottom: 0;">Upgrade now to continue building valuable business relationships. Our users typically see a 3x ROI within the first month by staying consistent with their outreach efforts.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/pricing" style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px;">Upgrade Now - Keep Your Data</a>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">Questions about upgrading? Reply to this email and we''ll help you choose the right plan.</p>
        
        <p>Don''t let your networking progress stop here,<br>The PinkWizard Team</p>
    </div>
</body>
</html>',
    'Hi {{user_name}},

Your PinkWizard trial expires in just 2 days. Don''t lose access to all the valuable networking data and relationships you''ve built!

What happens when your trial expires:
- You''ll lose access to your contact database
- Follow-up reminders will stop  
- AI outreach generation will be disabled
- Revenue tracking will be unavailable

Keep Your Momentum Going: Upgrade now to continue building valuable business relationships. Our users typically see a 3x ROI within the first month by staying consistent with their outreach efforts.

Upgrade now - Keep your data: {{app_url}}/pricing

Questions about upgrading? Reply to this email and we''ll help you choose the right plan.

Don''t let your networking progress stop here,
The PinkWizard Team',
    'Urgency email sent 2 days before trial expires',
    '{"user_name": "User''s display name", "app_url": "URL to the application"}'::jsonb
),
(
    'trial_expired',
    'Trial Expired - Upgrade to Keep Access',
    'Your trial has expired - upgrade to continue',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Trial Has Expired</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Trial Expired</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">But your networking journey doesn''t have to end</p>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi {{user_name}},</p>
        
        <p>Your 14-day PinkWizard trial has expired, but the relationships you''ve started building are too valuable to lose.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">🔒 Your Account Status</h3>
            <p style="margin-bottom: 0;">Your contacts and data are safely stored, but access is currently limited. Upgrade now to restore full functionality and continue growing your business network.</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #28a745;">🚀 Ready to Upgrade?</h3>
            <p>Choose the plan that fits your networking goals:</p>
            <ul>
                <li><strong>Starter Plan</strong> - Perfect for solo entrepreneurs</li>
                <li><strong>Professional Plan</strong> - Ideal for growing businesses</li>
                <li><strong>Enterprise Plan</strong> - Built for teams and agencies</li>
            </ul>
            <p style="margin-bottom: 0;">All plans include unlimited contacts, AI outreach, follow-up automation, and revenue tracking.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{app_url}}/pricing" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px;">View Pricing & Upgrade</a>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">Need help choosing a plan? Reply to this email and we''ll provide personalized recommendations.</p>
        
        <p>Ready to unlock your networking potential,<br>The PinkWizard Team</p>
    </div>
</body>
</html>',
    'Hi {{user_name}},

Your 14-day PinkWizard trial has expired, but the relationships you''ve started building are too valuable to lose.

Your Account Status: Your contacts and data are safely stored, but access is currently limited. Upgrade now to restore full functionality and continue growing your business network.

Ready to Upgrade? Choose the plan that fits your networking goals:
- Starter Plan - Perfect for solo entrepreneurs
- Professional Plan - Ideal for growing businesses  
- Enterprise Plan - Built for teams and agencies

All plans include unlimited contacts, AI outreach, follow-up automation, and revenue tracking.

View pricing & upgrade: {{app_url}}/pricing

Need help choosing a plan? Reply to this email and we''ll provide personalized recommendations.

Ready to unlock your networking potential,
The PinkWizard Team',
    'Email sent when trial expires to encourage upgrade',
    '{"user_name": "User''s display name", "app_url": "URL to the application"}'::jsonb
);

-- Create email sequences for trial nurture
INSERT INTO public.email_sequences (
    id,
    trigger_event,
    name,
    description,
    is_active
) VALUES 
(
    gen_random_uuid(),
    'trial_started',
    'Trial Nurture Sequence',
    'Email sequence to nurture trial users and encourage conversion',
    true
);

-- Get the sequence ID for the steps
INSERT INTO public.email_sequence_steps (
    sequence_id,
    step_order,
    delay_days,
    delay_hours,
    template_key,
    subject_override,
    is_active
) VALUES 
(
    (SELECT id FROM email_sequences WHERE trigger_event = 'trial_started'),
    1,
    0,
    0,
    'trial_welcome',
    NULL,
    true
),
(
    (SELECT id FROM email_sequences WHERE trigger_event = 'trial_started'),
    2,
    7,
    0,
    'trial_day_7_checkin',
    NULL,
    true
),
(
    (SELECT id FROM email_sequences WHERE trigger_event = 'trial_started'),
    3,
    12,
    0,
    'trial_day_12_urgency',
    NULL,
    true
),
(
    (SELECT id FROM email_sequences WHERE trigger_event = 'trial_started'),
    4,
    15,
    0,
    'trial_expired',
    NULL,
    true
);