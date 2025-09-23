-- Update the 75 Hard challenge email template with better header formatting (fixed quotes)
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
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
        
        /* Enhanced header styles */
        h3 { 
            background: linear-gradient(135deg, #ec4899, #8b5cf6); 
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
            background: #8b5cf6; 
            color: white; 
            padding: 12px 16px; 
            margin: 20px 0 10px 0; 
            border-radius: 6px; 
            font-size: 16px; 
            font-weight: bold;
        }
        
        h2 {
            color: #ec4899;
            font-size: 24px;
            font-weight: bold;
            border-bottom: 3px solid #ec4899;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .badge { background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        
        /* Special styling for date sections */
        .date-section {
            background: #f8fafc;
            border: 2px solid #ec4899;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .date-header {
            background: #ec4899;
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
            <h4>🔑 Your Access Details</h4>
            <p><strong>Important:</strong> Your login credentials from <strong>75hardmobilebevpros.com</strong> will work on <strong>www.pink-wizard.com</strong></p>
            <p>📱 You can access your challenge through:</p>
            <ul>
                <li><strong>Direct:</strong> <a href="https://www.pink-wizard.com">www.pink-wizard.com</a></li>
                <li><strong>Redirect:</strong> 75hardmobilebevpros.com (automatically redirects)</li>
            </ul>
        </div>

        <div class="date-section">
            <div class="date-header">
                <span class="date-icon">📅</span>
                Before September 8th
            </div>
            <p>While the challenge officially starts on <strong>September 8th</strong>, you can get a head start by:</p>
            <ul>
                <li>✅ Completing your onboarding checklist (earn early points!)</li>
                <li>✅ Setting up your business profile</li>
                <li>✅ Exploring the platform features</li>
                <li>✅ Connecting with other challenge participants</li>
            </ul>
            <p><em>Note: Some features will unlock on September 8th when the challenge officially begins.</em></p>
        </div>

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
            <li>🥇 <strong>Networking Leader:</strong> Most new relationships built</li>
            <li>🥈 <strong>Revenue Champion:</strong> Highest business growth tracked</li>
            <li>🥉 <strong>Consistency King/Queen:</strong> Best daily task completion rate</li>
            <li>🏅 <strong>Community Star:</strong> Most active in community engagement</li>
        </ul>

        <h3>🚀 Ready to Get Started?</h3>
        <p>Jump into your challenge dashboard and start building your mobile bar empire!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.pink-wizard.com" class="cta-button">🎯 Enter Challenge HQ</a>
        </div>

        <div class="highlight">
            <h4>💬 Need Help?</h4>
            <ul>
                <li><strong>Technical Support:</strong> Contact us through the help section in your dashboard</li>
                <li><strong>Challenge Questions:</strong> Join the community discussions</li>
                <li><strong>Login Issues:</strong> Use your existing 75hardmobilebevpros.com credentials</li>
            </ul>
        </div>

        <h3>🎯 This Is Your Time</h3>
        <p>The holiday season is the perfect opportunity to build your mobile bar business. With PinkWizard as your command center, you have all the tools you need to track your progress, stay motivated, and achieve your goals.</p>
        
        <p><strong>Let us make this holiday season your most profitable yet!</strong></p>
        
        <p>Cheers to your success,<br>
        <strong>The PinkWizard Team</strong></p>
    </div>

    <div class="footer">
        <p>You are receiving this because you signed up for the 75 Hard Mobile Bar Challenge.</p>
        <p>Questions? Reply to this email or visit <a href="https://www.pink-wizard.com/help">our help center</a></p>
    </div>
</body>
</html>'
WHERE template_key = 'challenge_announcement';