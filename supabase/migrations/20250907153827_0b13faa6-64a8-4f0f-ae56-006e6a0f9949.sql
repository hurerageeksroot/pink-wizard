-- Update the Challenge Is Live email template with better email-compatible HTML
UPDATE public.email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge Is Live!</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        
        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f8fafc !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            line-height: 1.6 !important;
        }
        
        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff !important;
            font-size: 28px !important;
            margin: 0 !important;
            font-weight: bold !important;
        }
        .header p {
            color: #fce7f3 !important;
            font-size: 16px !important;
            margin: 10px 0 0 0 !important;
        }
        
        /* Content */
        .content {
            padding: 30px 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #be185d !important;
            font-size: 22px !important;
            margin-bottom: 15px !important;
            border-bottom: 2px solid #ec4899;
            padding-bottom: 8px !important;
            font-weight: bold !important;
        }
        
        /* Task Cards */
        .task-grid {
            margin: 20px 0;
        }
        .task-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        .task-card h3 {
            color: #0f172a !important;
            font-size: 18px !important;
            margin: 0 0 10px 0 !important;
            font-weight: bold !important;
        }
        .task-card p {
            color: #64748b !important;
            font-size: 14px !important;
            margin: 0 !important;
            line-height: 1.5 !important;
        }
        
        /* Highlight Box */
        .highlight-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
            border: 1px solid #f59e0b;
        }
        .highlight-box h3 {
            color: #92400e !important;
            margin: 0 0 12px 0 !important;
            font-size: 18px !important;
            font-weight: bold !important;
        }
        .highlight-box p {
            color: #78350f !important;
            margin: 0 !important;
            font-size: 15px !important;
        }
        
        /* Resource List */
        .resource-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        .resource-item {
            background-color: #f1f5f9;
            margin: 10px 0;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #ec4899;
        }
        .resource-item a {
            color: #be185d !important;
            text-decoration: none !important;
            font-weight: 600 !important;
            font-size: 15px !important;
        }
        .resource-item a:hover {
            text-decoration: underline !important;
        }
        .resource-desc {
            color: #64748b !important;
            font-size: 14px !important;
            margin-top: 5px !important;
        }
        
        /* CTA Button */
        .cta-button {
            display: inline-block !important;
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%) !important;
            color: #ffffff !important;
            padding: 15px 25px !important;
            border-radius: 8px !important;
            text-decoration: none !important;
            font-weight: bold !important;
            font-size: 16px !important;
            margin: 15px 5px !important;
            border: none !important;
        }
        .cta-button:hover {
            opacity: 0.9 !important;
            color: #ffffff !important;
        }
        
        /* Footer */
        .footer {
            background-color: #1f2937;
            color: #d1d5db !important;
            padding: 30px 20px;
            text-align: center;
        }
        .footer p {
            color: #d1d5db !important;
            margin: 10px 0 !important;
        }
        .footer a {
            color: #ec4899 !important;
            text-decoration: none !important;
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .header h1 { font-size: 24px !important; }
            .content { padding: 20px 15px !important; }
            .task-card { margin-bottom: 10px !important; padding: 15px !important; }
            .cta-button { display: block !important; margin: 10px 0 !important; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🚀 THE CHALLENGE IS LIVE! 🚀</h1>
            <p>Your 75-Day Journey to Outreach Mastery Starts NOW!</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Welcome Section -->
            <div class="section">
                <h2>🎉 Welcome, {{user_name}}!</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">The moment you''ve been waiting for is here! Our 75-day challenge is officially LIVE and we couldn''t be more excited to have you on this incredible journey.</p>
                
                <div class="highlight-box">
                    <h3>🏆 What You''ll Achieve in 75 Days</h3>
                    <p>Master cold outreach • Build your network • Generate qualified leads • Increase your revenue • Develop consistent systems</p>
                </div>
            </div>

            <!-- Task Overview -->
            <div class="section">
                <h2>📋 Your Challenge Structure</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Here''s how your challenge is organized to ensure maximum success:</p>
                
                <div class="task-grid">
                    <div class="task-card">
                        <h3>📅 Daily Tasks</h3>
                        <p>Focus on daily outreach activities, follow-ups, and relationship building. Complete 3-5 tasks each day to build momentum.</p>
                    </div>
                    <div class="task-card">
                        <h3>📊 Weekly Goals</h3>
                        <p>Bigger objectives like content creation, list building, and campaign optimization. Track your weekly progress.</p>
                    </div>
                    <div class="task-card">
                        <h3>🎯 Program Milestones</h3>
                        <p>Major achievements throughout the 75 days including system setup, automation, and advanced strategies.</p>
                    </div>
                    <div class="task-card">
                        <h3>🚀 Onboarding Tasks</h3>
                        <p>Essential setup tasks to get you started strong. Complete these first for maximum impact!</p>
                    </div>
                </div>
            </div>

            <!-- Critical First Steps -->
            <div class="section">
                <h2>⚡ Complete Your Onboarding FIRST!</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;"><strong>Before diving into daily tasks, make sure you complete your onboarding tasks!</strong> These are designed to set you up for success throughout the entire challenge.</p>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{dashboard_url}}" class="cta-button">Complete Onboarding Tasks →</a>
                </div>
            </div>

            <!-- Resources Section -->
            <div class="section">
                <h2>📚 Your Resource Library</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">We''ve created an extensive resource library to support your success. Here are the key materials you need:</p>
                
                <div class="resource-list">
                    <div class="resource-item">
                        <a href="{{resources_url}}">📱 Monthly Content Plan for Social Media</a>
                        <div class="resource-desc">Ready-to-use content templates and scheduling strategies</div>
                    </div>
                    <div class="resource-item">
                        <a href="{{resources_url}}">❄️ Cold Outreach Playbook</a>
                        <div class="resource-desc">Proven scripts, templates, and best practices</div>
                    </div>
                    <div class="resource-item">
                        <a href="{{resources_url}}">📝 How to Assemble a Cold Outreach List</a>
                        <div class="resource-desc">Step-by-step guide to building your target list</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{resources_url}}" class="cta-button">Access All Resources →</a>
                </div>
            </div>

            <!-- Leaderboard -->
            <div class="section">
                <h2>🏆 Join the Competition!</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Track your progress and see how you stack up against other participants on our live leaderboard. Compete in multiple categories:</p>
                
                <div class="task-grid">
                    <div class="task-card">
                        <h3>🎯 Points Leader</h3>
                        <p>Earn points for completing tasks, activities, and hitting milestones</p>
                    </div>
                    <div class="task-card">
                        <h3>💰 Revenue Leader</h3>
                        <p>Track and showcase your revenue generation from challenge activities</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{leaderboard_url}}" class="cta-button">View Leaderboard →</a>
                </div>
            </div>

            <!-- Access Help -->
            <div class="section">
                <h2>🔐 Having Trouble Accessing?</h2>
                <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">If you''re having issues accessing pink-wizard.com, try these steps:</p>
                <ul style="color: #374151; font-size: 15px; line-height: 1.6; margin-left: 20px;">
                    <li>Clear your browser cache and cookies</li>
                    <li><strong>Reset your password</strong> using the link below</li>
                    <li>Try accessing from a different browser or device</li>
                    <li>Check if you''re using the correct email address</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{{reset_password_url}}" class="cta-button">Reset Password →</a>
                </div>
            </div>

            <!-- Final CTA -->
            <div class="section">
                <div class="highlight-box">
                    <h3>🎯 Ready to Start Your Journey?</h3>
                    <p style="margin-bottom: 20px;">Don''t wait! Log into your dashboard now and begin with your onboarding tasks. The next 75 days will transform how you approach outreach and networking.</p>
                    <div style="text-align: center;">
                        <a href="{{dashboard_url}}" class="cta-button">Start Your Challenge →</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Questions? Reply to this email or visit our <a href="{{help_url}}">Help Center</a></p>
            <p style="font-size: 14px; margin-top: 15px;">You''re receiving this because you''re a registered participant in our 75-Day Challenge.</p>
        </div>
    </div>
</body>
</html>',
text_content = 'THE CHALLENGE IS LIVE! 🚀

Your 75-Day Journey to Outreach Mastery Starts NOW!

Welcome, {{user_name}}!

The moment you''ve been waiting for is here! Our 75-day challenge is officially LIVE and we couldn''t be more excited to have you on this incredible journey.

What You''ll Achieve in 75 Days:
• Master cold outreach
• Build your network  
• Generate qualified leads
• Increase your revenue
• Develop consistent systems

YOUR CHALLENGE STRUCTURE:

📅 Daily Tasks
Focus on daily outreach activities, follow-ups, and relationship building. Complete 3-5 tasks each day to build momentum.

📊 Weekly Goals  
Bigger objectives like content creation, list building, and campaign optimization. Track your weekly progress.

🎯 Program Milestones
Major achievements throughout the 75 days including system setup, automation, and advanced strategies.

🚀 Onboarding Tasks
Essential setup tasks to get you started strong. Complete these first for maximum impact!

⚡ COMPLETE YOUR ONBOARDING FIRST!

Before diving into daily tasks, make sure you complete your onboarding tasks! These are designed to set you up for success throughout the entire challenge.

Start here: {{dashboard_url}}

📚 YOUR RESOURCE LIBRARY:

• Monthly Content Plan for Social Media - Ready-to-use content templates and scheduling strategies
• Cold Outreach Playbook - Proven scripts, templates, and best practices  
• How to Assemble a Cold Outreach List - Step-by-step guide to building your target list

Access resources: {{resources_url}}

🏆 JOIN THE COMPETITION!

Track your progress on our live leaderboard:
• Points Leader - Earn points for completing tasks and hitting milestones
• Revenue Leader - Track your revenue generation from challenge activities

View leaderboard: {{leaderboard_url}}

🔐 HAVING TROUBLE ACCESSING?

If you''re having issues accessing pink-wizard.com:
• Clear your browser cache and cookies
• Reset your password: {{reset_password_url}}
• Try a different browser or device
• Check you''re using the correct email address

🎯 Ready to Start Your Journey?

Don''t wait! Log into your dashboard now and begin with your onboarding tasks. The next 75 days will transform how you approach outreach and networking.

Start your challenge: {{dashboard_url}}

Questions? Reply to this email or visit our Help Center: {{help_url}}

You''re receiving this because you''re a registered participant in our 75-Day Challenge.'
WHERE template_key = 'challenge_is_live';