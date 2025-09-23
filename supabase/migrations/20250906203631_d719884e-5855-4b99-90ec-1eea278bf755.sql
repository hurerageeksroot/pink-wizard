-- Fix leaderboard to exclude non-challenge participants
-- Set rank_position to NULL for users who are not active challenge participants
UPDATE public.leaderboard_stats ls
SET rank_position = NULL 
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.profiles p 
  JOIN public.user_challenge_progress ucp ON ucp.user_id = p.id AND ucp.is_active = true
  WHERE p.id = ls.user_id 
    AND p.show_in_leaderboard = true
);