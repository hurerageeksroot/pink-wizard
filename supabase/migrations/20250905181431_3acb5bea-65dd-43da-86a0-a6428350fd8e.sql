-- Fix duplicate user_has_active_trial functions causing import failures
-- Keep only the parameterized version which is more flexible

DROP FUNCTION IF EXISTS public.user_has_active_trial();

-- The parameterized version already exists and should handle both cases