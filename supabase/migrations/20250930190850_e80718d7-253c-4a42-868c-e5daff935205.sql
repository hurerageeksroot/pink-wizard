-- Add missing total_points column to leaderboard_stats
ALTER TABLE public.leaderboard_stats 
ADD COLUMN IF NOT EXISTS total_points BIGINT NOT NULL DEFAULT 0;

-- Backfill total_points from user_points_ledger
UPDATE public.leaderboard_stats ls
SET total_points = COALESCE(
  (SELECT SUM(points_earned) 
   FROM public.user_points_ledger upl 
   WHERE upl.user_id = ls.user_id),
  0
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_total_points 
ON public.leaderboard_stats(total_points DESC);