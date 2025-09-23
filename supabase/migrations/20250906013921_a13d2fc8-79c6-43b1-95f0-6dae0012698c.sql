-- Create a comprehensive admin stats function
CREATE OR REPLACE FUNCTION get_comprehensive_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb := '{}';
    total_users_count int;
    total_contacts_count int;
    total_activities_count int;
    total_payments_count int;
    recent_signups_count int;
    active_challenges_count int;
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Get total users count
    SELECT COUNT(*) INTO total_users_count FROM auth.users;
    
    -- Get total contacts count
    SELECT COUNT(*) INTO total_contacts_count FROM contacts;
    
    -- Get total activities count
    SELECT COUNT(*) INTO total_activities_count FROM activities;
    
    -- Get total payments count (using service role context)
    SELECT COUNT(*) INTO total_payments_count FROM payments WHERE status = 'succeeded';
    
    -- Get recent signups (last 30 days)
    SELECT COUNT(*) INTO recent_signups_count 
    FROM auth.users 
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    -- Get active challenges (placeholder - adjust based on your challenge logic)
    SELECT 1 INTO active_challenges_count;
    
    -- Build result JSON
    result := jsonb_build_object(
        'total_users', total_users_count,
        'total_contacts', total_contacts_count,
        'total_activities', total_activities_count,
        'total_payments', total_payments_count,
        'recent_signups', recent_signups_count,
        'active_challenges', active_challenges_count
    );
    
    RETURN result;
END;
$$;

-- Create function to get admin user list with proper auth access
CREATE OR REPLACE FUNCTION get_admin_user_list()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    email_confirmed_at timestamptz,
    display_name text,
    avatar_url text,
    company_name text,
    location text,
    show_in_leaderboard boolean,
    roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.created_at,
        au.last_sign_in_at,
        au.email_confirmed_at,
        p.display_name,
        p.avatar_url,
        p.company_name,
        p.location,
        p.show_in_leaderboard,
        COALESCE(
            ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
            ARRAY[]::text[]
        ) as roles
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    LEFT JOIN user_roles ur ON au.id = ur.user_id
    GROUP BY au.id, au.email, au.created_at, au.last_sign_in_at, au.email_confirmed_at,
             p.display_name, p.avatar_url, p.company_name, p.location, p.show_in_leaderboard
    ORDER BY au.created_at DESC;
END;
$$;