-- Create consolidated admin statistics RPC function
CREATE OR REPLACE FUNCTION public.get_admin_comprehensive_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
  user_count integer;
  contact_count integer;
  activity_count integer;
  total_points bigint;
  challenge_participants integer;
  badge_count integer;
  networking_count integer;
  email_count integer;
  total_revenue numeric;
  avg_engagement numeric;
  recent_signups integer;
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get all counts efficiently with head-only queries
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  SELECT COUNT(*) INTO contact_count FROM public.contacts;
  SELECT COUNT(*) INTO activity_count FROM public.activities;
  SELECT COUNT(*) INTO badge_count FROM public.user_badges;
  SELECT COUNT(*) INTO networking_count FROM public.networking_events;
  SELECT COUNT(*) INTO email_count FROM public.email_logs;
  
  -- Get challenge participants count
  SELECT COUNT(*) INTO challenge_participants 
  FROM public.user_challenge_progress 
  WHERE is_active = true;
  
  -- Get total points efficiently
  SELECT COALESCE(SUM(points_earned), 0) INTO total_points 
  FROM public.user_points_ledger;
  
  -- Get total revenue efficiently
  SELECT COALESCE(SUM(revenue_amount), 0) INTO total_revenue 
  FROM public.contacts 
  WHERE revenue_amount IS NOT NULL;
  
  -- Calculate average engagement
  avg_engagement := CASE 
    WHEN user_count > 0 THEN activity_count::numeric / user_count::numeric 
    ELSE 0 
  END;
  
  -- Get recent signups (last 7 days)
  SELECT COUNT(*) INTO recent_signups 
  FROM public.profiles 
  WHERE created_at >= now() - interval '7 days';

  -- Build comprehensive result
  result := jsonb_build_object(
    'total_users', user_count,
    'total_contacts', contact_count,
    'total_activities', activity_count,
    'total_points', total_points,
    'active_challenge_participants', challenge_participants,
    'total_badges_earned', badge_count,
    'total_networking_events', networking_count,
    'total_email_logs', email_count,
    'total_revenue', total_revenue,
    'avg_user_engagement', ROUND(avg_engagement, 2),
    'recent_signups', recent_signups
  );

  RETURN result;
END;
$function$;

-- Create efficient user analytics RPC function
CREATE OR REPLACE FUNCTION public.get_admin_user_analytics()
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   total_points bigint,
   total_activities bigint,
   total_revenue numeric,
   events_booked bigint,
   contacts_count bigint,
   win_rate numeric,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    COALESCE(points.total_points, 0) as total_points,
    COALESCE(activities.activity_count, 0) as total_activities,
    COALESCE(contacts.revenue_sum, 0) as total_revenue,
    COALESCE(contacts.booked_count, 0) as events_booked,
    COALESCE(contacts.contact_count, 0) as contacts_count,
    CASE 
      WHEN COALESCE(contacts.contact_count, 0) > 0 
      THEN ROUND((COALESCE(contacts.won_count, 0)::numeric / contacts.contact_count::numeric) * 100, 2)
      ELSE 0 
    END as win_rate,
    p.created_at
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      user_id,
      SUM(points_earned) as total_points
    FROM public.user_points_ledger
    GROUP BY user_id
  ) points ON p.id = points.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as activity_count
    FROM public.activities
    GROUP BY user_id
  ) activities ON p.id = activities.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as contact_count,
      SUM(COALESCE(revenue_amount, 0)) as revenue_sum,
      COUNT(*) FILTER (WHERE booking_scheduled = true) as booked_count,
      COUNT(*) FILTER (WHERE status = 'won') as won_count
    FROM public.contacts
    GROUP BY user_id
  ) contacts ON p.id = contacts.user_id
  ORDER BY total_points DESC;
END;
$function$;

-- Create efficient user growth analytics RPC
CREATE OR REPLACE FUNCTION public.get_admin_user_growth_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get user growth data for last 12 months
  WITH monthly_signups AS (
    SELECT 
      DATE_TRUNC('month', created_at)::date as month,
      COUNT(*) as users
    FROM public.profiles
    WHERE created_at >= now() - interval '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', to_char(month, 'YYYY-MM'),
      'users', users
    )
  ) INTO result
  FROM monthly_signups;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- Create efficient activity breakdown analytics RPC
CREATE OR REPLACE FUNCTION public.get_admin_activity_breakdown()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get activity breakdown for last 30 days
  WITH activity_counts AS (
    SELECT 
      type,
      COUNT(*) as count
    FROM public.activities
    WHERE created_at >= now() - interval '30 days'
    GROUP BY type
    ORDER BY count DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', type,
      'count', count
    )
  ) INTO result
  FROM activity_counts;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;