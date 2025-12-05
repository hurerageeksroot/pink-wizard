-- Correct Vanessa K's missing task completions for Day 21 (using WHERE id IN)

-- Update the three specific user_daily_tasks records by their primary key IDs
UPDATE public.user_daily_tasks
SET 
  completed = true,
  completed_at = CASE 
    WHEN id = '49fc419a-c128-4797-adf9-3f5b91303359' THEN '2025-09-28 02:05:34+00'::timestamptz  -- Social Media Touch
    WHEN id = '1aa9b733-8d2e-4e30-85b0-4508e21ed942' THEN '2025-09-28 02:05:36+00'::timestamptz  -- Warm Contact
    WHEN id = 'a5256abc-8dd8-432c-b836-bb8f2bb8bf8b' THEN '2025-09-28 02:22:39+00'::timestamptz  -- Cold Contact #1
  END,
  updated_at = now()
WHERE id IN (
  'a5256abc-8dd8-432c-b836-bb8f2bb8bf8b',  -- Cold Contact #1
  '1aa9b733-8d2e-4e30-85b0-4508e21ed942',  -- Warm Contact
  '49fc419a-c128-4797-adf9-3f5b91303359'   -- Social Media Touch
);

-- Update challenge progress to reflect the corrected completions
SELECT public.update_daily_challenge_progress();