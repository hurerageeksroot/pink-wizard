-- Adjust challenge start date for testing - make today appear as day 2
UPDATE public.challenge_config 
SET 
  start_date = '2025-09-01',  -- This makes today (Sept 2nd) day 2 of the challenge
  end_date = '2025-11-14',    -- Adjust end date accordingly (75 days from Sept 1st)
  current_day = 2,
  updated_at = now()
WHERE is_active = true;