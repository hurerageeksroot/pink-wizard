-- Fix search path for the newly created functions to resolve security warnings
CREATE OR REPLACE FUNCTION broadcast_challenge_email(
  p_template_key TEXT,
  p_subject_override TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_config RECORD;
  participant_count INTEGER := 0;
  email_result JSONB;
BEGIN
  -- Only admins can broadcast emails
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to broadcast emails';
  END IF;

  -- Get active challenge
  SELECT * INTO challenge_config 
  FROM challenge_config 
  WHERE is_active = true 
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active challenge found';
  END IF;

  -- Get challenge participants and send emails
  FOR participant_count IN
    SELECT COUNT(*)
    FROM user_challenge_progress ucp
    JOIN profiles p ON p.id = ucp.user_id
    WHERE ucp.is_active = true
      AND p.email IS NOT NULL
  LOOP
    NULL; -- Just counting
  END LOOP;

  -- Insert into email_sequence_logs for processing by the email function
  INSERT INTO email_sequence_logs (
    sequence_id,
    step_id, 
    user_id,
    scheduled_for,
    status
  )
  SELECT 
    gen_random_uuid(), -- placeholder sequence_id
    gen_random_uuid(), -- placeholder step_id
    ucp.user_id,
    NOW(),
    'scheduled'
  FROM user_challenge_progress ucp
  JOIN profiles p ON p.id = ucp.user_id
  WHERE ucp.is_active = true
    AND p.email IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'participant_count', participant_count,
    'template_key', p_template_key,
    'message', format('Email broadcast scheduled for %s challenge participants', participant_count)
  );
END;
$$;

-- Fix search path for award_challenge_prizes function
CREATE OR REPLACE FUNCTION award_challenge_prizes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_winner RECORD;
  revenue_winner RECORD;
  networking_winner RECORD;
  result JSONB := '[]'::jsonb;
BEGIN
  -- Only admins can award prizes
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Insufficient permissions to award challenge prizes';
  END IF;

  -- Get top points winner
  SELECT user_id, total_points, display_name
  INTO points_winner
  FROM get_points_leaderboard()
  ORDER BY total_points DESC
  LIMIT 1;

  -- Get top revenue winner  
  SELECT user_id, total_revenue, display_name
  INTO revenue_winner
  FROM get_revenue_leaderboard()
  ORDER BY total_revenue DESC
  LIMIT 1;

  -- Get top networking winner (most contacts added)
  SELECT c.user_id, COUNT(*) as contact_count, p.display_name
  INTO networking_winner
  FROM contacts c
  JOIN profiles p ON p.id = c.user_id
  JOIN user_challenge_progress ucp ON ucp.user_id = c.user_id
  WHERE ucp.is_active = true
  GROUP BY c.user_id, p.display_name
  ORDER BY contact_count DESC
  LIMIT 1;

  -- Create admin notifications for prize winners
  IF points_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED',
      'challenge_prize',
      points_winner.user_id,
      jsonb_build_object(
        'category', 'points_leader',
        'display_name', points_winner.display_name,
        'total_points', points_winner.total_points,
        'prize', 'Custom Yeti Water Bottle - Points Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Points Leader',
      'winner', points_winner.display_name,
      'value', points_winner.total_points,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  IF revenue_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED', 
      'challenge_prize',
      revenue_winner.user_id,
      jsonb_build_object(
        'category', 'revenue_leader',
        'display_name', revenue_winner.display_name,
        'total_revenue', revenue_winner.total_revenue,
        'prize', 'Custom Yeti Water Bottle - Revenue Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Revenue Leader',
      'winner', revenue_winner.display_name, 
      'value', revenue_winner.total_revenue,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  IF networking_winner.user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details)
    VALUES (
      auth.uid(),
      'PRIZE_AWARDED',
      'challenge_prize', 
      networking_winner.user_id,
      jsonb_build_object(
        'category', 'networking_leader',
        'display_name', networking_winner.display_name,
        'contact_count', networking_winner.contact_count,
        'prize', 'Custom Yeti Water Bottle - Networking Champion'
      )
    );
    
    result := result || jsonb_build_object(
      'category', 'Networking Leader',
      'winner', networking_winner.display_name,
      'value', networking_winner.contact_count,
      'prize', 'Custom Yeti Water Bottle'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winners', result,
    'message', 'Challenge prizes awarded successfully'
  );
END;
$$;