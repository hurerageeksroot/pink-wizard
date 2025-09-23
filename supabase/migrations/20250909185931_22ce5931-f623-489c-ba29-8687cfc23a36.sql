-- Fix update_leaderboard_stats function to use only existing columns
CREATE OR REPLACE FUNCTION public.update_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update leaderboard stats for all active challenge participants
  -- Only use columns that actually exist in leaderboard_stats table
  INSERT INTO public.leaderboard_stats (
    user_id,
    current_streak,
    longest_streak,
    updated_at
  )
  SELECT 
    ucp.user_id,
    COALESCE(ucp.current_streak, 0) as current_streak,
    COALESCE(ucp.longest_streak, 0) as longest_streak,
    now() as updated_at
  FROM public.user_challenge_progress ucp
  WHERE ucp.is_active = true
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    updated_at = EXCLUDED.updated_at;
    
  -- Log the update
  RAISE NOTICE 'Leaderboard stats updated successfully';
END;
$function$