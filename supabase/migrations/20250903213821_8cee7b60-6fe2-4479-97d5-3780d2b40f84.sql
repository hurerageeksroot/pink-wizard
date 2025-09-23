-- Create email templates table for customizable email content
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- Create email logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  resend_id TEXT
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_templates
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active email templates" 
ON public.email_templates 
FOR SELECT 
USING (is_active = true);

-- RLS policies for email_logs
CREATE POLICY "Admins can view all email logs" 
ON public.email_logs 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view their own email logs" 
ON public.email_logs 
FOR SELECT 
USING (recipient_user_id = auth.uid());

CREATE POLICY "Service role can manage email logs" 
ON public.email_logs 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Insert default email templates
INSERT INTO public.email_templates (template_key, name, subject, html_content, text_content, variables, description) VALUES
('welcome_email', 'Welcome Email', 'Welcome to {{app_name}}!', 
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #2563eb;">Welcome to {{app_name}}!</h1></div><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><p>Hi {{user_name}},</p><p>Thank you for joining our CRM platform! We''re excited to help you build stronger relationships and grow your business.</p><p><strong>Here''s what you can do to get started:</strong></p><ul><li>Complete your business profile</li><li>Import your existing contacts</li><li>Set up your follow-up cadences</li><li>Start tracking your networking activities</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></div><p style="color: #64748b; font-size: 14px;">Need help? Reply to this email or visit our help center.</p></body></html>',
'Welcome to {{app_name}}!\n\nHi {{user_name}},\n\nThank you for joining our CRM platform! We''re excited to help you build stronger relationships and grow your business.\n\nHere''s what you can do to get started:\n- Complete your business profile\n- Import your existing contacts\n- Set up your follow-up cadences\n- Start tracking your networking activities\n\nVisit your dashboard: {{dashboard_url}}\n\nNeed help? Reply to this email or visit our help center.',
'{"app_name": "CRM App", "user_name": "User Name", "dashboard_url": "Dashboard URL"}',
'Sent to new users when they sign up'),

('reward_notification', 'Reward Notification', 'Congratulations! You''ve earned {{reward_name}}!',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #16a34a;">🎉 Congratulations!</h1></div><div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;"><h2 style="margin: 0 0 10px 0;">You''ve earned {{reward_name}}!</h2><p style="margin: 0; font-size: 18px;">{{points_earned}} points</p></div><div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><p>Hi {{user_name}},</p><p>Great job! You''ve just earned <strong>{{reward_name}}</strong> for {{achievement_description}}.</p><p><strong>Your Progress:</strong></p><ul><li>Total Points: {{total_points}}</li><li>Current Streak: {{current_streak}} days</li><li>Rank: #{{rank_position}}</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="{{leaderboard_url}}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Leaderboard</a></div></body></html>',
'🎉 Congratulations!\n\nYou''ve earned {{reward_name}}!\n{{points_earned}} points\n\nHi {{user_name}},\n\nGreat job! You''ve just earned {{reward_name}} for {{achievement_description}}.\n\nYour Progress:\n- Total Points: {{total_points}}\n- Current Streak: {{current_streak}} days\n- Rank: #{{rank_position}}\n\nView Leaderboard: {{leaderboard_url}}',
'{"reward_name": "Badge Name", "points_earned": "50", "user_name": "User Name", "achievement_description": "completing 10 activities", "total_points": "500", "current_streak": "5", "rank_position": "10", "leaderboard_url": "Leaderboard URL"}',
'Sent when users earn badges or achieve milestones'),

('follow_up_reminder', 'Follow-up Reminder', 'Time to follow up with {{contact_name}}',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #ea580c;">📅 Follow-up Reminder</h1></div><div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; margin-bottom: 20px;"><p>Hi {{user_name}},</p><p>It''s time to follow up with <strong>{{contact_name}}</strong> from {{contact_company}}.</p><p><strong>Contact Details:</strong></p><ul><li>Email: {{contact_email}}</li><li>Phone: {{contact_phone}}</li><li>Status: {{contact_status}}</li><li>Last Contact: {{last_contact_date}}</li></ul></div><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><p><strong>Suggested Follow-up Actions:</strong></p><ul><li>Send a personalized email checking in</li><li>Schedule a call to discuss their needs</li><li>Share relevant resources or case studies</li><li>Connect on LinkedIn if not already connected</li></ul></div><div style="text-align: center; margin: 30px 0;"><a href="{{contact_url}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Contact</a></div></body></html>',
'📅 Follow-up Reminder\n\nHi {{user_name}},\n\nIt''s time to follow up with {{contact_name}} from {{contact_company}}.\n\nContact Details:\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n- Status: {{contact_status}}\n- Last Contact: {{last_contact_date}}\n\nSuggested Follow-up Actions:\n- Send a personalized email checking in\n- Schedule a call to discuss their needs\n- Share relevant resources or case studies\n- Connect on LinkedIn if not already connected\n\nView Contact: {{contact_url}}',
'{"user_name": "User Name", "contact_name": "Contact Name", "contact_company": "Company Name", "contact_email": "contact@example.com", "contact_phone": "555-1234", "contact_status": "warm", "last_contact_date": "2024-01-15", "contact_url": "Contact URL"}',
'Sent to remind users to follow up with contacts'),

('admin_notification', 'Admin Notification', 'Admin Alert: {{alert_type}}',
'<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #dc2626;">⚠️ Admin Alert</h1></div><div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px;"><h2 style="color: #dc2626; margin-top: 0;">{{alert_type}}</h2><p><strong>Message:</strong> {{message}}</p><p><strong>User:</strong> {{user_email}} ({{user_name}})</p><p><strong>Time:</strong> {{timestamp}}</p></div><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><p><strong>Additional Details:</strong></p><pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">{{details}}</pre></div><div style="text-align: center; margin: 30px 0;"><a href="{{admin_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Admin Panel</a></div></body></html>',
'⚠️ Admin Alert\n\n{{alert_type}}\n\nMessage: {{message}}\nUser: {{user_email}} ({{user_name}})\nTime: {{timestamp}}\n\nAdditional Details:\n{{details}}\n\nView Admin Panel: {{admin_url}}',
'{"alert_type": "System Error", "message": "Error message", "user_email": "user@example.com", "user_name": "User Name", "timestamp": "2024-01-15 10:30:00", "details": "Error details", "admin_url": "Admin URL"}',
'Sent to administrators for important system alerts');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_templates_updated_at();