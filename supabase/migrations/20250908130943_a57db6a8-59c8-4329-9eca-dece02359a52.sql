-- Fix business_profiles table: deduplicate and add unique constraint
-- First, delete older duplicates keeping the most recent per user
DELETE FROM public.business_profiles bp
USING (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
    FROM public.business_profiles
  ) t
  WHERE t.rn > 1
) d
WHERE bp.id = d.id;

-- Add unique constraint on user_id
ALTER TABLE public.business_profiles
ADD CONSTRAINT business_profiles_user_id_unique UNIQUE (user_id);