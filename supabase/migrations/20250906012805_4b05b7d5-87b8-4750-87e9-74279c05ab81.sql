-- Create content_pages table for content and help article management
CREATE TABLE public.content_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  page_type TEXT NOT NULL DEFAULT 'article', -- 'article', 'help', 'page'
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all content pages" 
ON public.content_pages 
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view published content pages" 
ON public.content_pages 
FOR SELECT 
USING (is_published = true);

-- Create updated_at trigger
CREATE TRIGGER update_content_pages_updated_at
BEFORE UPDATE ON public.content_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_user_weekly_tasks_updated_at();

-- Create comprehensive admin stats function
CREATE OR REPLACE FUNCTION public.get_comprehensive_admin_stats()
RETURNS TABLE(
  total_users bigint,
  total_contacts bigint,
  total_activities bigint,
  total_points bigint,
  active_challenge_participants bigint,
  total_badges_earned bigint,
  total_rewards_claimed bigint,
  total_networking_events bigint,
  total_revenue numeric,
  total_content_pages bigint,
  total_email_logs bigint,
  avg_user_engagement numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.contacts) as total_contacts,
    (SELECT COUNT(*) FROM public.activities) as total_activities,
    (SELECT COALESCE(SUM(points_earned), 0) FROM public.user_points_ledger) as total_points,
    (SELECT COUNT(*) FROM public.user_challenge_progress WHERE is_active = true) as active_challenge_participants,
    (SELECT COUNT(*) FROM public.user_badges) as total_badges_earned,
    (SELECT COUNT(*) FROM public.user_rewards WHERE is_claimed = true) as total_rewards_claimed,
    (SELECT COUNT(*) FROM public.networking_events) as total_networking_events,
    (SELECT COALESCE(SUM(revenue_amount), 0) FROM public.contacts WHERE status = 'won') as total_revenue,
    (SELECT COUNT(*) FROM public.content_pages) as total_content_pages,
    (SELECT COUNT(*) FROM public.email_logs) as total_email_logs,
    (SELECT COALESCE(AVG(activity_count), 0) FROM (
      SELECT COUNT(*) as activity_count 
      FROM public.activities 
      WHERE created_at >= now() - interval '30 days'
      GROUP BY user_id
    ) user_activities) as avg_user_engagement;
END;
$$;