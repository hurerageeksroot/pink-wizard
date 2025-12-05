-- Drop the old award_points function that uses activity_weights
-- Keep the newer one that uses points_values table
DROP FUNCTION IF EXISTS public.award_points(uuid, text, text, jsonb, integer);