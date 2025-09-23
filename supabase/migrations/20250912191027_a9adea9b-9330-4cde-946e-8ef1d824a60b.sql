-- Update leaderboard stats for all users after backfill
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Update leaderboard stats for all users who had points added
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM user_points_ledger 
    WHERE description LIKE 'BACKFILL:%'
  LOOP
    PERFORM public.update_leaderboard_stats(user_record.user_id);
  END LOOP;
END $$;