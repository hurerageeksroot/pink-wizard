-- Simplify leaderboard ranking to use user_challenge_progress as single source of truth
-- Drop and recreate update_leaderboard_stats with proper ranking logic

DROP FUNCTION IF EXISTS public.update_leaderboard_stats();

CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Clear existing leaderboard stats
  DELETE FROM public.leaderboard_stats;
  
  -- Populate leaderboard_stats directly from user_challenge_progress with proper ranking
  INSERT INTO public.leaderboard_stats (
    user_id,
    display_name,
    avatar_url,
    total_days_completed,
    current_streak,
    longest_streak,
    overall_progress,
    completion_rate,
    rank_position,
    last_updated
  )
  SELECT 
    ucp.user_id,
    p.display_name,
    p.avatar_url,
    ucp.total_days_completed,
    ucp.current_streak,
    ucp.longest_streak,
    ucp.overall_progress,
    -- Calculate completion rate based on days since challenge start
    CASE 
      WHEN cc.start_date IS NOT NULL THEN
        LEAST(100.0, (ucp.total_days_completed::numeric / GREATEST(1, (CURRENT_DATE - cc.start_date + 1))) * 100.0)
      ELSE 0.0
    END as completion_rate,
    -- Proper ranking with tie-breaking: days completed, current streak, longest streak, join date
    DENSE_RANK() OVER (
      ORDER BY 
        ucp.total_days_completed DESC,
        ucp.current_streak DESC, 
        ucp.longest_streak DESC,
        ucp.joined_at ASC
    ) as rank_position,
    NOW() as last_updated
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  LEFT JOIN public.challenge_config cc ON cc.is_active = true
  WHERE ucp.is_active = true
    AND p.show_in_leaderboard = true
  ORDER BY 
    ucp.total_days_completed DESC,
    ucp.current_streak DESC,
    ucp.longest_streak DESC,
    ucp.joined_at ASC;
END;
$function$;

-- Update the daily progress function to call leaderboard stats update
CREATE OR REPLACE FUNCTION public.update_daily_challenge_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  config_rec RECORD;
  user_rec RECORD;
  activity_count INTEGER;
  days_since_start INTEGER;
  current_streak_count INTEGER;
  longest_streak_count INTEGER;
  progress_percentage NUMERIC;
BEGIN
  -- Get active challenge config
  SELECT * INTO config_rec
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF config_rec IS NULL THEN
    RAISE NOTICE 'No active challenge found';
    RETURN;
  END IF;

  -- Process each active challenge participant
  FOR user_rec IN 
    SELECT ucp.user_id, ucp.joined_at
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  LOOP
    -- Count activities since challenge start (or user join date, whichever is later)
    SELECT COUNT(DISTINCT DATE(created_at)) INTO activity_count
    FROM public.activities
    WHERE user_id = user_rec.user_id
      AND created_at::date >= GREATEST(config_rec.start_date, user_rec.joined_at::date)
      AND created_at::date <= COALESCE(config_rec.end_date, CURRENT_DATE);

    -- Calculate days since start (for this user)
    days_since_start := GREATEST(1, (CURRENT_DATE - GREATEST(config_rec.start_date, user_rec.joined_at::date) + 1));

    -- Calculate current streak (consecutive days with activities)
    current_streak_count := 0;
    
    -- Count consecutive days with activities working backwards from today
    FOR i IN 0..(days_since_start - 1) LOOP
      IF EXISTS (
        SELECT 1 FROM public.activities 
        WHERE user_id = user_rec.user_id 
          AND created_at::date = (CURRENT_DATE - i)
      ) THEN
        current_streak_count := current_streak_count + 1;
      ELSE
        EXIT; -- Break streak
      END IF;
    END LOOP;

    -- Calculate longest streak
    longest_streak_count := 0;
    
    -- This is a simplified approach - we'll use current streak as longest for now
    -- In production, you'd want a more sophisticated algorithm to find the actual longest streak
    SELECT GREATEST(current_streak_count, COALESCE(MAX(ucp2.longest_streak), 0))
    INTO longest_streak_count
    FROM public.user_challenge_progress ucp2
    WHERE ucp2.user_id = user_rec.user_id;

    -- Calculate progress percentage
    progress_percentage := CASE 
      WHEN days_since_start > 0 THEN 
        LEAST(100.0, (activity_count::numeric / days_since_start::numeric) * 100.0)
      ELSE 0.0
    END;

    -- Update user challenge progress
    UPDATE public.user_challenge_progress
    SET 
      total_days_completed = activity_count,
      current_streak = current_streak_count,
      longest_streak = GREATEST(longest_streak_count, current_streak_count),
      overall_progress = progress_percentage,
      updated_at = NOW()
    WHERE user_id = user_rec.user_id AND is_active = true;

  END LOOP;

  -- Update leaderboard stats with new rankings
  PERFORM public.update_leaderboard_stats();

  RAISE NOTICE 'Daily challenge progress updated for % active participants', 
    (SELECT COUNT(*) FROM public.user_challenge_progress WHERE is_active = true);
END;
$function$;

-- Ensure leaderboard stats are updated when challenge progress changes
CREATE OR REPLACE FUNCTION public.trigger_leaderboard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update leaderboard stats when challenge progress changes
  PERFORM public.update_leaderboard_stats();
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_leaderboard_on_progress_change ON public.user_challenge_progress;

-- Create trigger to update leaderboard when progress changes
CREATE TRIGGER update_leaderboard_on_progress_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_leaderboard_update();

-- Run initial update to populate correct rankings
SELECT public.update_daily_challenge_progress();