-- Update the Challenge Is Live email template to match the beautiful gradient style
UPDATE public.email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge Is Live!</title>
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
            <h1>🏆 75 Hard Mobile Bar Challenge (Holiday Edition)</h1>
            <p>Get ready to level up your business this holiday season!</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-header">
                    <h2>🎉 Surprise! Welcome to Your Challenge HQ</h2>
                </div>
                
                <p>Hello {{user_name}},</p>
                
                <p>We have an exciting surprise for you! Your <strong>75 Hard Mobile Bar Challenge (Holiday Edition)</strong> will be powered by <strong>PinkWizard</strong> - your new command center for tracking progress, earning rewards, and dominating the leaderboards!</p>
                
                <div class="highlight-box">
                    <h3>🔑 Your Access Details</h3>
                    <p><strong>Important:</strong> Your login credentials from <strong>75hardmobilebevpros.com</strong> will work on <strong>www.pink-wizard.com</strong></p>
                    
                    <p><strong>📱 You can access your challenge through:</strong></p>
                    <ul>
                        <li><strong>Direct:</strong> <a href="https://www.pink-wizard.com" style="color: #ec4899;">www.pink-wizard.com</a></li>
                        <li><strong>Redirect:</strong> 75hardmobilebevpros.com (automatically redirects)</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>📅 Before September 8th</h2>
                </div>
                
                <p>While the challenge officially starts on <strong>September 8th</strong>, you can get a head start by:</p>
                
                <ul class="feature-list">
                    <li><span class="check-icon">✅</span> Completing your onboarding checklist (earn early points!)</li>
                    <li><span class="check-icon">✅</span> Setting up your business profile</li>
                    <li><span class="check-icon">✅</span> Exploring the platform features</li>
                    <li><span class="check-icon">✅</span> Connecting with other challenge participants</li>
                </ul>
                
                <p><strong>Note:</strong> Some features will unlock on September 8th when the challenge officially begins.</p>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>🎯 What Unlocks September 8th</h2>
                </div>
                
                <ul class="feature-list">
                    <li><span class="check-icon">•</span> <strong>Daily Challenge Tasks</strong> - Your 75-day journey begins</li>
                    <li><span class="check-icon">•</span> <strong>Live Leaderboards</strong> - Points, revenue, and networking rankings</li>
                    <li><span class="check-icon">•</span> <strong>Challenge Community</strong> - Connect with fellow participants</li>
                    <li><span class="check-icon">•</span> <strong>Reward System</strong> - Earn badges and prizes for your achievements</li>
                </ul>
            </div>
            
            <div class="section">
                <div class="section-header">
                    <h2>🏅 How You Earn Points & Rewards</h2>
                </div>
                
                <p>Track your progress and compete with others as you build your mobile bar empire!</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.pink-wizard.com" class="cta-button">Access Your Challenge HQ →</a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Ready to dominate the leaderboards? Let''s make this holiday season your most profitable yet!</p>
            <p>Questions? Reply to this email - we''re here to help!</p>
        </div>
    </div>
</body>
</html>',
  subject = '🏆 Your 75 Hard Challenge HQ is Ready - Welcome to PinkWizard!',
  variables = jsonb_build_object(
    'user_name', jsonb_build_object(
      'type', 'string',
      'description', 'The user''s display name from their profile',
      'required', true
    )
  )
WHERE template_key = 'challenge_is_live';