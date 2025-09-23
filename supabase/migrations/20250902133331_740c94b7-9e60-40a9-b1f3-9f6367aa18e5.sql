-- Update the challenge configuration to reflect the correct launch date
UPDATE public.challenge_config 
SET 
  start_date = '2025-09-08',
  end_date = '2025-11-22',
  current_day = 1,
  updated_at = now()
WHERE is_active = true;