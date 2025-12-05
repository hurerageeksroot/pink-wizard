-- Create points_values table for activity point definitions
CREATE TABLE IF NOT EXISTS public.points_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_values ENABLE ROW LEVEL SECURITY;

-- Admins can manage points values
CREATE POLICY "Admins can manage points values"
  ON public.points_values
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Authenticated users can view active points values
CREATE POLICY "Authenticated users can view active points values"
  ON public.points_values
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Insert standard point values for different activity types
INSERT INTO public.points_values (activity_type, points, description, is_active) VALUES
  ('email', 15, 'Email outreach activity', true),
  ('call', 20, 'Phone call activity', true),
  ('meeting', 25, 'Meeting or video call activity', true),
  ('social_media', 10, 'Social media interaction', true),
  ('networking_event', 30, 'Networking event attendance', true),
  ('referral', 40, 'Referral made', true),
  ('daily_task_completed', 10, 'Daily task completion', true),
  ('weekly_task_completed', 25, 'Weekly task completion', true),
  ('contact_added', 5, 'New contact added', true),
  ('contact_won', 100, 'Contact converted to won status', true),
  ('streak_bonus_7', 50, '7-day streak bonus', true),
  ('streak_bonus_14', 100, '14-day streak bonus', true),
  ('streak_bonus_30', 200, '30-day streak bonus', true),
  ('weekly_outreach_bonus', 75, 'Weekly outreach bonus (500+ points)', true),
  ('weekly_wins_bonus', 150, 'Weekly wins bonus (5+ wins)', true)
ON CONFLICT (activity_type) DO NOTHING;