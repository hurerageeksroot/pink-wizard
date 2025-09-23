-- Update the leaderboard RLS policy to show all opted-in users, not just those with progress
DROP POLICY IF EXISTS "View consented leaderboard data only" ON public.leaderboard_stats;

-- Create new policy that shows all users who opted in, regardless of progress
CREATE POLICY "View consented leaderboard data only" 
ON public.leaderboard_stats 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    (user_id = auth.uid()) OR  -- Users can always see their own stats
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = leaderboard_stats.user_id 
        AND profiles.show_in_leaderboard = true
    ))
  )
);

-- Also ensure all users have a leaderboard entry by calling the update function
SELECT update_leaderboard_stats();