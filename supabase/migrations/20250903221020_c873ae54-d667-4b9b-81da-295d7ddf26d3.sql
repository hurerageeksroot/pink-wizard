UPDATE email_templates 
SET 
  html_content = '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f8fafc, #f1f8f6);"><div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, hsl(338, 89%, 64%), hsl(338, 89%, 74%)); border-radius: 12px; color: white;"><h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PinkWizard! ✨</h1></div><div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><p style="font-size: 16px; line-height: 1.6; color: #374151;">Hey {{user_name}},</p><p style="font-size: 16px; line-height: 1.6; color: #374151;">Welcome to the wizarding world of better relationships and bigger business! We''re thrilled you''re here.</p><p style="font-size: 16px; line-height: 1.6; color: #374151;">Most business owners hate cold outreach and struggle to keep in touch with their networks. We built PinkWizard to change that. Think of it as your personal magical assistant for building real, valuable connections.</p><p style="font-size: 16px; line-height: 1.6; color: #374151; font-weight: bold;">Here''s your spellbook for getting started:</p><ol style="color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;"><li><strong>Set up your profile.</strong> Tell us a little about your business so we can get your magic wand ready.</li><li><strong>Import your contacts.</strong> Bring your crew into the wizarding world so you can start working your magic.</li><li><strong>Track your activities.</strong> Log your outreach and watch your network grow!</li><li><strong>Track your wins.</strong> We love a good celebration!</li></ol><p style="font-size: 16px; line-height: 1.6; color: #374151;">Ready to cast your first spell? Head to your dashboard and let''s get started:</p></div><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: linear-gradient(135deg, hsl(338, 89%, 64%), hsl(338, 89%, 74%)); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Go to Dashboard</a></div><div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><p style="color: #374151; font-size: 16px; line-height: 1.6;">If you have any questions or just want to say hi, reply to this email. We''re always here to help.</p><p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 0;"><strong>To your success,<br>The PinkWizard Team</strong></p></div></body></html>',
  text_content = 'Welcome to PinkWizard! ✨

Hey {{user_name}},

Welcome to the wizarding world of better relationships and bigger business! We''re thrilled you''re here.

Most business owners hate cold outreach and struggle to keep in touch with their networks. We built PinkWizard to change that. Think of it as your personal magical assistant for building real, valuable connections.

Here''s your spellbook for getting started:

1. Set up your profile. Tell us a little about your business so we can get your magic wand ready.
2. Import your contacts. Bring your crew into the wizarding world so you can start working your magic.
3. Track your activities. Log your outreach and watch your network grow!
4. Track your wins. We love a good celebration!

Ready to cast your first spell? Head to your dashboard and let''s get started:

{{dashboard_url}}

If you have any questions or just want to say hi, reply to this email. We''re always here to help.

To your success,
The PinkWizard Team',
  subject = 'Welcome to PinkWizard! ✨',
  updated_at = now()
WHERE template_key = 'welcome_email'