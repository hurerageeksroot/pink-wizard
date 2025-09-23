-- Insert the "Challenge Is Live" email template
INSERT INTO public.email_templates (
  template_key,
  name,
  subject,
  html_content,
  description,
  variables,
  is_active
) VALUES (
  'challenge_is_live',
  'Challenge Is Live - Welcome & Overview',
  '🚀 The Challenge is LIVE! Your 75-Day Journey Starts NOW!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Challenge Is Live!</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #fafafa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: bold; }
    .header p { color: #fce7f3; font-size: 16px; margin: 10px 0 0 0; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #be185d; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #ec4899; padding-bottom: 5px; }
    .task-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
    .task-card h3 { color: #0f172a; font-size: 16px; margin: 0 0 8px 0; }
    .task-card p { color: #64748b; font-size: 14px; margin: 0; }
    .highlight-box { background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 8px; padding: 20px; margin: 15px 0; }
    .highlight-box h3 { color: #92400e; margin: 0 0 10px 0; }
    .resource-list { list-style: none; padding: 0; }
    .resource-list li { background: #f1f5f9; margin: 8px 0; padding: 12px; border-radius: 6px; border-left: 4px solid #ec4899; }
    .resource-list a { color: #be185d; text-decoration: none; font-weight: 500; }
    .resource-list a:hover { text-decoration: underline; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
    .cta-button:hover { opacity: 0.9; }
    .footer { background: #1f2937; color: #d1d5db; padding: 30px 20px; text-align: center; }
    .footer a { color: #ec4899; text-decoration: none; }
    @media (max-width: 600px) {
      .task-grid { grid-template-columns: 1fr; }
      .header h1 { font-size: 24px; }
      .content { padding: 20px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
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
        <p>The moment you''ve been waiting for is here! Our 75-day challenge is officially LIVE and we couldn''t be more excited to have you on this incredible journey.</p>
        
        <div class="highlight-box">
          <h3>🏆 What You''ll Achieve in 75 Days</h3>
          <p>Master cold outreach • Build your network • Generate qualified leads • Increase your revenue • Develop consistent systems</p>
        </div>
      </div>

      <!-- Task Overview -->
      <div class="section">
        <h2>📋 Your Challenge Structure</h2>
        <p>Here''s how your challenge is organized to ensure maximum success:</p>
        
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
        <p><strong>Before diving into daily tasks, make sure you complete your onboarding tasks!</strong> These are designed to set you up for success throughout the entire challenge.</p>
        
        <a href="{{dashboard_url}}" class="cta-button">Complete Onboarding Tasks →</a>
      </div>

      <!-- Resources Section -->
      <div class="section">
        <h2>📚 Your Resource Library</h2>
        <p>We''ve created an extensive resource library to support your success. Here are the key materials you need:</p>
        
        <ul class="resource-list">
          <li><a href="{{resources_url}}">📱 Monthly Content Plan for Social Media</a> - Ready-to-use content templates and scheduling strategies</li>
          <li><a href="{{resources_url}}">❄️ Cold Outreach Playbook</a> - Proven scripts, templates, and best practices</li>
          <li><a href="{{resources_url}}">📝 How to Assemble a Cold Outreach List</a> - Step-by-step guide to building your target list</li>
        </ul>
        
        <a href="{{resources_url}}" class="cta-button">Access All Resources →</a>
      </div>

      <!-- Leaderboard -->
      <div class="section">
        <h2>🏆 Join the Competition!</h2>
        <p>Track your progress and see how you stack up against other participants on our live leaderboard. Compete in multiple categories:</p>
        
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
        
        <a href="{{leaderboard_url}}" class="cta-button">View Leaderboard →</a>
      </div>

      <!-- Access Help -->
      <div class="section">
        <h2>🔐 Having Trouble Accessing?</h2>
        <p>If you''re having issues accessing pink-wizard.com, try these steps:</p>
        <ul>
          <li>Clear your browser cache and cookies</li>
          <li><strong>Reset your password</strong> using the link below</li>
          <li>Try accessing from a different browser or device</li>
          <li>Check if you''re using the correct email address</li>
        </ul>
        
        <a href="{{reset_password_url}}" class="cta-button">Reset Password →</a>
      </div>

      <!-- Final CTA -->
      <div class="section">
        <div class="highlight-box">
          <h3>🎯 Ready to Start Your Journey?</h3>
          <p>Don''t wait! Log into your dashboard now and begin with your onboarding tasks. The next 75 days will transform how you approach outreach and networking.</p>
          <a href="{{dashboard_url}}" class="cta-button">Start Your Challenge →</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Questions? Reply to this email or visit our <a href="{{help_url}}">Help Center</a></p>
      <p>You''re receiving this because you''re a registered participant in our 75-Day Challenge.</p>
    </div>
  </div>
</body>
</html>',
  'Celebratory email announcing the challenge is live with task overview, resources, and access help',
  '{"user_name": "Participant name", "dashboard_url": "Link to dashboard", "resources_url": "Link to resources section", "leaderboard_url": "Link to leaderboard", "reset_password_url": "Link to password reset", "help_url": "Link to help center"}'::jsonb,
  true
);