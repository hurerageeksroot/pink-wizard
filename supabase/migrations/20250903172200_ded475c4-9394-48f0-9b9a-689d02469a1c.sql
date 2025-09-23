-- Extend 75 Hard challenge to November 22nd, 2025
UPDATE public.challenge_config 
SET 
  end_date = '2025-11-22',
  total_days = 83,
  updated_at = now()
WHERE is_active = true;