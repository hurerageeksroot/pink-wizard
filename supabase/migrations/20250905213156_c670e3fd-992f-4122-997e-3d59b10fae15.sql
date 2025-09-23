-- Create email template for challenge announcement
INSERT INTO email_templates (
  template_key,
  name,
  subject,
  html_content,
  description,
  is_active
) VALUES (
  'challenge_announcement',
  '75 Hard Mobile Bar Challenge - What to Expect',
  'Your 75 Hard Mobile Bar Challenge Starts September 8th - Important Info Inside!',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>75 Hard Mobile Bar Challenge</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px 20px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
        .content { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .highlight { background: #fef3f2; border-left: 4px solid #ec4899; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #ec4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .badge { background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 75 Hard Mobile Bar Challenge (Holiday Edition)</h1>
        <p>Get ready to level up your business this holiday season!</p>
    </div>

    <div class="content">
        <h2>🎉 Surprise! Welcome to Your Challenge HQ</h2>
        <p>Hello {{user_name}},</p>
        
        <p>We have an exciting surprise for you! Your <strong>75 Hard Mobile Bar Challenge (Holiday Edition)</strong> will be powered by <strong>PinkWizard</strong> - your new command center for tracking progress, earning rewards, and dominating the leaderboards!</p>

        <div class="highlight">
            <h3>🔑 Your Access Details</h3>
            <p><strong>Important:</strong> Your login credentials from <strong>75hardmobilebevpros.com</strong> will work on <strong>www.pink-wizard.com</strong></p>
            <p>📱 You can access your challenge through:</p>
            <ul>
                <li><strong>Direct:</strong> <a href="https://www.pink-wizard.com">www.pink-wizard.com</a></li>
                <li><strong>Redirect:</strong> 75hardmobilebevpros.com (automatically redirects)</li>
            </ul>
        </div>

        <h3>📅 Before September 8th</h3>
        <p>While the challenge officially starts on <strong>September 8th</strong>, you can get a head start by:</p>
        <ul>
            <li>✅ Completing your onboarding checklist (earn early points!)</li>
            <li>✅ Setting up your business profile</li>
            <li>✅ Exploring the platform features</li>
            <li>✅ Connecting with other challenge participants</li>
        </ul>
        <p><em>Note: Some features will unlock on September 8th when the challenge officially begins.</em></p>

        <h3>🎯 What Unlocks September 8th</h3>
        <ul>
            <li><strong>Daily Challenge Tasks</strong> - Your 75-day journey begins</li>
            <li><strong>Live Leaderboards</strong> - Points, revenue, and networking rankings</li>
            <li><strong>Challenge Community</strong> - Connect with fellow participants</li>
            <li><strong>Reward System</strong> - Earn badges and prizes for your achievements</li>
        </ul>

        <h3>🏅 How You Earn Points & Rewards</h3>
        <div class="highlight">
            <h4>Point System:</h4>
            <ul>
                <li><span class="badge">NETWORKING</span> Adding contacts, follow-ups, relationship building</li>
                <li><span class="badge">REVENUE</span> Tracking and reporting your business wins</li>
                <li><span class="badge">ENGAGEMENT</span> Community participation and daily check-ins</li>
                <li><span class="badge">CONSISTENCY</span> Daily task completion and streak bonuses</li>
            </ul>

            <h4>Badge System:</h4>
            <p>Unlock exclusive badges for milestones, achievements, and special accomplishments!</p>

            <h4>Variable Rewards:</h4>
            <p>Random bonus rewards based on your activity level and consistency - the more engaged you are, the better your chances!</p>
        </div>

        <h3>🏆 Grand Prizes</h3>
        <p>The top finishers in each leaderboard category will receive <strong>custom Yeti water bottles</strong> to commemorate their achievement!</p>
        <ul>
            <li>🥇 <strong>Top Points Leader</strong></li>
            <li>💰 <strong>Top Revenue Generator</strong></li>
            <li>🤝 <strong>Top Networking Champion</strong></li>
        </ul>

        <div class="highlight">
            <h3>🚀 Ready to Get Started?</h3>
            <p>Login now to complete your onboarding and start earning your first points!</p>
            <a href="https://www.pink-wizard.com" class="cta-button">Access Your Challenge HQ →</a>
        </div>

        <h3>💪 Your Success Formula</h3>
        <p>This isn''t just about the next 75 days - it''s about building systems that will transform your business. You''ll develop:</p>
        <ul>
            <li>Consistent follow-up habits that turn contacts into clients</li>
            <li>Trackable networking processes that show real ROI</li>
            <li>A supportive community of driven mobile bar professionals</li>
            <li>Gamified motivation that makes business growth actually fun</li>
        </ul>

        <p>Questions? Reply to this email or check out the Help Center inside PinkWizard.</p>

        <p>Let''s make this holiday season your most successful yet!</p>
        
        <p><strong>Ready. Set. Dominate! 🚀</strong></p>
        
        <p>The PinkWizard Team</p>
    </div>

    <div class="footer">
        <p>© 2024 PinkWizard | <a href="https://www.pink-wizard.com">www.pink-wizard.com</a></p>
        <p>You''re receiving this because you''re part of the 75 Hard Mobile Bar Challenge</p>
    </div>
</body>
</html>',
  'Challenge announcement email with platform introduction and access details',
  true
);

-- Create onboarding tasks specific to challenge participants
INSERT INTO onboarding_tasks_definition (
  name,
  description,
  category,
  sort_order,
  is_active
) VALUES 
(
  'Welcome to the 75 Hard Mobile Bar Challenge!',
  'Get familiar with your challenge headquarters. This is where you''ll track progress, earn points, and compete on the leaderboards.',
  'challenge_setup',
  1,
  true
),
(
  'Complete Your Business Profile',
  'Set up your business profile so the AI can create personalized outreach messages that sound like you. This is essential for the networking challenges ahead.',
  'challenge_setup',
  2,
  true
),
(
  'Add Your First 5 Contacts',
  'Import your contact list or manually add your first 5 networking contacts. These will be the foundation of your networking challenge activities.',
  'challenge_setup',
  3,
  true
),
(
  'Explore the Leaderboards',
  'Check out the three leaderboards: Points, Revenue, and Networking. See where you stand and what you need to do to climb the rankings.',
  'challenge_setup',
  4,
  true
),
(
  'Join the Challenge Community',
  'Connect with other 75 Hard participants in the community feed. Share your goals and start building relationships with fellow mobile bar pros.',
  'challenge_setup',
  5,
  true
),
(
  'Set Your Challenge Goal',
  'Define what success looks like for your 75-day journey. Whether it''s revenue targets, networking goals, or skill development - make it specific and measurable.',
  'challenge_setup',
  6,
  true
);

-- Create function to broadcast emails to challenge participants
CREATE OR REPLACE FUNCTION broadcast_challenge_email(
  p_template_key TEXT,
  p_subject_override TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_config RECORD;
  participant_count INTEGER := 0;
  email_result JSONB;
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Get active challenge
  SELECT * INTO challenge_config 
  FROM challenge_config 
  WHERE is_active = true 
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active challenge found';
  END IF;

  -- Get challenge participants and send emails
  FOR participant_count IN
    SELECT COUNT(*)
    FROM user_challenge_progress ucp
    JOIN profiles p ON p.id = ucp.user_id
    WHERE ucp.is_active = true
      AND p.email IS NOT NULL
  LOOP
    NULL; -- Just counting
  END LOOP;

  -- Insert into email_sequence_logs for processing by the email function
  INSERT INTO email_sequence_logs (
    sequence_id,
    step_id, 
    user_id,
    scheduled_for,
    status
  )
  SELECT 
    gen_random_uuid(), -- placeholder sequence_id
    gen_random_uuid(), -- placeholder step_id
    ucp.user_id,
    NOW(),
    'scheduled'
  FROM user_challenge_progress ucp
  JOIN profiles p ON p.id = ucp.user_id
  WHERE ucp.is_active = true
    AND p.email IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'participant_count', participant_count,
    'template_key', p_template_key,
    'message', format('Email broadcast scheduled for %s challenge participants', participant_count)
  );
END;
$$;

-- Create function to award challenge prizes
CREATE OR REPLACE FUNCTION award_challenge_prizes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  points_winner RECORD;
  revenue_winner RECORD;
  networking_winner RECORD;
  result JSONB := '[]'::jsonb;
BEGIN
  -- Only admins can award prizes
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to award challenge prizes';
  END IF;

  -- Get top points winner
  SELECT user_id, total_points, display_name
  INTO points_winner
  FROM get_points_leaderboard()
  ORDER BY total_points DESC
  LIMIT 1;

  -- Get top revenue winner  
  SELECT user_id, total_revenue, display_name
  INTO revenue_winner
  FROM get_revenue_leaderboard()
  ORDER BY total_revenue DESC
  LIMIT 1;

  -- Get top networking winner (most contacts added)
  SELECT c.user_id, COUNT(*) as contact_count, p.display_name
  INTO networking_winner
  FROM contacts c
  JOIN profiles p ON p.id = c.user_id
  JOIN user_challenge_progress ucp ON ucp.user_id = c.user_id
  WHERE ucp.is_active = true
  GROUP BY c.user_id, p.display_name
  ORDER BY contact_count DESC
  LIMIT 1;

  -- Create admin notifications for prize winners
  IF points_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED',
      'challenge_prize',
      points_winner.user_id,
      jsonb_build_object(
        'category', 'points_leader',
        'display_name', points_winner.display_name,
        'total_points', points_winner.total_points,
        'prize', 'Custom Yeti Water Bottle - Points Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Points Leader',
      'winner', points_winner.display_name,
      'value', points_winner.total_points,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  IF revenue_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED', 
      'challenge_prize',
      revenue_winner.user_id,
      jsonb_build_object(
        'category', 'revenue_leader',
        'display_name', revenue_winner.display_name,
        'total_revenue', revenue_winner.total_revenue,
        'prize', 'Custom Yeti Water Bottle - Revenue Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Revenue Leader',
      'winner', revenue_winner.display_name, 
      'value', revenue_winner.total_revenue,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  IF networking_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED',
      'challenge_prize', 
      networking_winner.user_id,
      jsonb_build_object(
        'category', 'networking_leader',
        'display_name', networking_winner.display_name,
        'contact_count', networking_winner.contact_count,
        'prize', 'Custom Yeti Water Bottle - Networking Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Networking Leader',
      'winner', networking_winner.display_name,
      'value', networking_winner.contact_count,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winners', result,
    'message', 'Challenge prizes awarded successfully'
  );
END;
$$;