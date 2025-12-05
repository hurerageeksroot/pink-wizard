-- Create challenge completion email template with winner celebration

INSERT INTO email_templates (
  template_key,
  name,
  subject,
  html_content,
  text_content,
  is_active,
  variables,
  created_by
) VALUES (
  'challenge_complete',
  'Challenge Completion - Final Winners Celebration',
  '🎉 You Did It! Challenge Complete + Your Lifetime Access',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #E91E8C 0%, #FF6B9D 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: bold; }
    .header p { color: rgba(255,255,255,0.95); margin: 0; font-size: 18px; }
    .content { padding: 40px 30px; color: #1f2937; line-height: 1.6; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .winners-section { background: linear-gradient(135deg, #FFF5F7 0%, #FFE5EC 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #E91E8C; }
    .winners-title { color: #E91E8C; font-size: 24px; font-weight: bold; margin: 0 0 20px 0; text-align: center; }
    .winner-category { margin-bottom: 25px; }
    .category-title { color: #1f2937; font-size: 16px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .winner-item { background: white; padding: 15px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .winner-rank { color: #E91E8C; font-weight: bold; margin-right: 12px; font-size: 20px; }
    .winner-name { flex: 1; font-weight: 600; color: #1f2937; }
    .winner-stat { color: #6b7280; font-weight: 500; }
    .cta-section { text-align: center; margin: 40px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #E91E8C 0%, #FF6B9D 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .access-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .access-box h3 { color: #065F46; margin: 0 0 10px 0; font-size: 18px; }
    .footer { background: #f9fafb; padding: 30px 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Challenge Complete!</h1>
      <p>The final results are in...</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hey {{user_name}},</p>
      
      <p><strong>You made it!</strong> The challenge has officially wrapped, and what an incredible journey it''s been. You showed up, put in the work, and built momentum that''s going to pay off for years to come.</p>
      
      <div class="winners-section">
        <h2 class="winners-title">🏆 Final Winners - Hall of Fame</h2>
        
        <div class="winner-category">
          <div class="category-title">💎 Most Points (Consistency Champion)</div>
          <div class="winner-item">
            <span class="winner-rank">🥇</span>
            <span class="winner-name">{{points_winner_name}}</span>
            <span class="winner-stat">{{points_winner_points}} points</span>
          </div>
          <div class="winner-item">
            <span class="winner-rank">🥈</span>
            <span class="winner-name">{{points_second_name}}</span>
            <span class="winner-stat">{{points_second_points}} points</span>
          </div>
          <div class="winner-item">
            <span class="winner-rank">🥉</span>
            <span class="winner-name">{{points_third_name}}</span>
            <span class="winner-stat">{{points_third_points}} points</span>
          </div>
        </div>
        
        <div class="winner-category">
          <div class="category-title">💰 Most Revenue (Results Rockstar)</div>
          <div class="winner-item">
            <span class="winner-rank">🥇</span>
            <span class="winner-name">{{revenue_winner_name}}</span>
            <span class="winner-stat">${{revenue_winner_amount}}</span>
          </div>
          <div class="winner-item">
            <span class="winner-rank">🥈</span>
            <span class="winner-name">{{revenue_second_name}}</span>
            <span class="winner-stat">${{revenue_second_amount}}</span>
          </div>
          <div class="winner-item">
            <span class="winner-rank">🥉</span>
            <span class="winner-name">{{revenue_third_name}}</span>
            <span class="winner-stat">${{revenue_third_amount}}</span>
          </div>
        </div>
      </div>
      
      <p><strong>These incredible humans proved what''s possible when you commit to relationship-building.</strong> Whether you finished #1 or made it through your first week, you''re part of a community that chose growth over comfort.</p>
      
      <div class="access-box">
        <h3>✨ Your Lifetime Access is Active</h3>
        <p style="margin: 0; color: #065F46;">Because you participated in the challenge, you now have <strong>continued access to PinkWizard</strong>. All your contacts, activities, and progress are saved and ready for you to keep building.</p>
      </div>
      
      <p><strong>Here''s the truth:</strong> The challenge might be over, but your network isn''t going anywhere. The relationships you''ve been nurturing? They''re just getting started.</p>
      
      <p><strong>What happens next is up to you:</strong></p>
      <ul>
        <li>Keep your momentum going with daily check-ins</li>
        <li>Watch as warm leads turn into closed deals</li>
        <li>See referrals flow in from the relationships you''ve built</li>
        <li>Reap the rewards of a solid, active network</li>
      </ul>
      
      <p>The difference between people who win long-term and those who don''t? <strong>They don''t stop when the challenge ends.</strong></p>
      
      <div class="cta-section">
        <a href="{{app_url}}" class="cta-button">Keep the Momentum Going →</a>
      </div>
      
      <p>Your future self is going to thank you for staying consistent.</p>
      
      <p>Keep crushing it,<br>
      <strong>The PinkWizard Team</strong></p>
    </div>
    
    <div class="footer">
      <p>PinkWizard - Your Relationship Management Partner</p>
      <p style="margin-top: 10px;">You''re receiving this because you participated in the challenge.</p>
    </div>
  </div>
</body>
</html>',
  'Challenge Complete - Final Winners

Hey {{user_name}},

You made it! The challenge has officially wrapped, and what an incredible journey it''s been.

FINAL WINNERS - HALL OF FAME

Most Points (Consistency Champion):
🥇 {{points_winner_name}} - {{points_winner_points}} points
🥈 {{points_second_name}} - {{points_second_points}} points  
🥉 {{points_third_name}} - {{points_third_points}} points

Most Revenue (Results Rockstar):
🥇 {{revenue_winner_name}} - ${{revenue_winner_amount}}
🥈 {{revenue_second_name}} - ${{revenue_second_amount}}
🥉 {{revenue_third_name}} - ${{revenue_third_amount}}

These incredible humans proved what''s possible when you commit to relationship-building.

YOUR LIFETIME ACCESS IS ACTIVE
Because you participated in the challenge, you now have continued access to PinkWizard. All your contacts, activities, and progress are saved.

The challenge might be over, but your network isn''t going anywhere. Keep your momentum going:
- Daily check-ins with your contacts
- Watch warm leads turn into closed deals  
- See referrals flow from relationships you''ve built
- Reap the rewards of a solid, active network

The difference between people who win long-term and those who don''t? They don''t stop when the challenge ends.

Keep the momentum going: {{app_url}}

Your future self will thank you for staying consistent.

Keep crushing it,
The PinkWizard Team',
  true,
  '{"user_name": "User", "app_url": "https://app.pink-wizard.com", "points_winner_name": "Winner Name", "points_winner_points": "20000", "points_winner_activities": "1500", "points_second_name": "Runner Up", "points_second_points": "15000", "points_third_name": "Third Place", "points_third_points": "10000", "revenue_winner_name": "Revenue Champion", "revenue_winner_amount": "25000", "revenue_winner_contacts": "20", "revenue_second_name": "Revenue Runner Up", "revenue_second_amount": "20000", "revenue_third_name": "Revenue Third", "revenue_third_amount": "15000"}'::jsonb,
  (SELECT id FROM profiles WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin') LIMIT 1)
)
ON CONFLICT (template_key) 
DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = now();