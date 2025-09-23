-- Function to get users with challenge participation status
CREATE OR REPLACE FUNCTION public.get_admin_users_with_challenge()
RETURNS TABLE(
    id uuid,
    email character varying,
    display_name text,
    avatar_url text,
    company_name text,
    location text,
    show_in_leaderboard boolean,
    created_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    email_confirmed_at timestamp with time zone,
    roles text[],
    challenge_active boolean,
    challenge_joined_at timestamp with time zone,
    challenge_days_completed integer,
    challenge_progress numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::varchar(255),
    p.display_name,
    p.avatar_url,
    p.company_name,
    p.location,
    p.show_in_leaderboard,
    p.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    COALESCE(
      array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::text[]
    ) as roles,
    COALESCE(ucp.is_active, false) as challenge_active,
    ucp.joined_at as challenge_joined_at,
    COALESCE(ucp.total_days_completed, 0) as challenge_days_completed,
    COALESCE(ucp.overall_progress, 0) as challenge_progress
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.user_challenge_progress ucp ON p.id = ucp.user_id
  GROUP BY p.id, au.email, p.display_name, p.avatar_url, p.company_name, 
           p.location, p.show_in_leaderboard, p.created_at, 
           au.last_sign_in_at, au.email_confirmed_at,
           ucp.is_active, ucp.joined_at, ucp.total_days_completed, ucp.overall_progress
  ORDER BY p.created_at DESC;
END;
$function$;

-- Function to toggle user challenge participation
CREATE OR REPLACE FUNCTION public.admin_toggle_user_challenge(
    target_user_id uuid,
    enable_challenge boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
BEGIN
    -- Only allow admin users to access this function
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF enable_challenge THEN
        -- Add user to challenge or reactivate
        INSERT INTO user_challenge_progress (
            user_id,
            joined_at,
            is_active,
            current_streak,
            longest_streak,
            total_days_completed,
            overall_progress
        ) VALUES (
            target_user_id,
            NOW(),
            true,
            0,
            0,
            0,
            0.00
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            is_active = true,
            joined_at = CASE 
                WHEN user_challenge_progress.is_active = false THEN NOW() 
                ELSE user_challenge_progress.joined_at 
            END;
        
        result := jsonb_build_object(
            'success', true,
            'action', 'enabled',
            'message', 'User added to challenge successfully'
        );
    ELSE
        -- Remove user from challenge
        UPDATE user_challenge_progress 
        SET is_active = false 
        WHERE user_id = target_user_id;
        
        result := jsonb_build_object(
            'success', true,
            'action', 'disabled',
            'message', 'User removed from challenge successfully'
        );
    END IF;

    -- Log the action
    INSERT INTO admin_audit_log (
        admin_user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        CASE WHEN enable_challenge THEN 'CHALLENGE_ENABLED' ELSE 'CHALLENGE_DISABLED' END,
        'user_challenge',
        target_user_id,
        jsonb_build_object(
            'target_user_id', target_user_id,
            'challenge_enabled', enable_challenge
        )
    );

    RETURN result;
END;
$function$;

-- Function to get challenge statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_challenge_stats()
RETURNS TABLE(
    total_participants integer,
    active_participants integer,
    avg_progress numeric,
    avg_days_completed numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only allow admin users to access this function
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_participants,
        COUNT(*) FILTER (WHERE is_active = true)::integer as active_participants,
        COALESCE(AVG(overall_progress) FILTER (WHERE is_active = true), 0) as avg_progress,
        COALESCE(AVG(total_days_completed) FILTER (WHERE is_active = true), 0) as avg_days_completed
    FROM user_challenge_progress;
END;
$function$;