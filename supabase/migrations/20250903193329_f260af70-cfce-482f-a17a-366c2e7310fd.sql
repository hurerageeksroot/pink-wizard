-- Fix security issues with views by making them SECURITY DEFINER
-- This is necessary for views that need to access data across multiple tables

-- Drop and recreate the views with proper security definer settings
DROP VIEW IF EXISTS public.points_leaderboard;
DROP VIEW IF EXISTS public.revenue_leaderboard;

-- Create security definer functions instead of views for better security
CREATE OR REPLACE FUNCTION public.get_points_leaderboard()
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    total_points BIGINT,
    total_activities BIGINT,
    rank_position BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        p.id as user_id,
        p.display_name,
        p.avatar_url,
        COALESCE(SUM(upl.points_earned), 0) as total_points,
        COUNT(upl.id) as total_activities,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(upl.points_earned), 0) DESC) as rank_position
    FROM public.profiles p
    LEFT JOIN public.user_points_ledger upl ON p.id = upl.user_id
    WHERE p.show_in_leaderboard = true
    GROUP BY p.id, p.display_name, p.avatar_url
    ORDER BY total_points DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_leaderboard()
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    total_revenue NUMERIC,
    won_deals BIGINT,
    total_contacts BIGINT,
    rank_position BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        p.id as user_id,
        p.display_name,
        p.avatar_url,
        COALESCE(SUM(c.revenue_amount), 0) as total_revenue,
        COUNT(c.id) FILTER (WHERE c.status = 'won') as won_deals,
        COUNT(c.id) as total_contacts,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) as rank_position
    FROM public.profiles p
    LEFT JOIN public.contacts c ON p.id = c.user_id AND c.status = 'won'
    WHERE p.show_in_leaderboard = true
    GROUP BY p.id, p.display_name, p.avatar_url
    ORDER BY total_revenue DESC;
$$;