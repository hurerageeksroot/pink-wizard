-- Step 1: Fix the award_activity_points function to remove 10x multiplication bug
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  weight_multiplier NUMERIC;
  points_to_award INTEGER;
  is_revenue_activity BOOLEAN;
BEGIN
  -- Check if this is a revenue activity (won status)
  is_revenue_activity := EXISTS(
    SELECT 1 FROM contacts 
    WHERE id = NEW.contact_id 
    AND status = 'won'
  );

  -- For revenue activities, award points based on revenue_amount
  IF is_revenue_activity THEN
    DECLARE
      revenue_val NUMERIC;
    BEGIN
      SELECT COALESCE(revenue_amount, 0) INTO revenue_val
      FROM contacts
      WHERE id = NEW.contact_id;
      
      -- Award 1 point per $100 in revenue (rounded down)
      points_to_award := FLOOR(revenue_val / 100)::INTEGER;
      
      IF points_to_award > 0 THEN
        INSERT INTO public.user_points_ledger (
          user_id,
          activity_type,
          points_earned,
          description,
          metadata,
          created_at
        ) VALUES (
          NEW.user_id,
          'revenue_milestone',
          points_to_award,
          'Revenue from won contact: $' || revenue_val::text,
          jsonb_build_object(
            'contact_id', NEW.contact_id,
            'activity_id', NEW.id,
            'revenue_amount', revenue_val
          ),
          now()
        );
      END IF;
    END;
  END IF;

  -- Get the weight for this activity type
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights
  WHERE activity_type = NEW.type AND is_active = true
  LIMIT 1;

  -- Default weight if not found
  weight_multiplier := COALESCE(weight_multiplier, 10);

  -- FIX: Remove the 10x multiplication - weight IS the points
  points_to_award := weight_multiplier;

  -- Award points for the activity
  INSERT INTO public.user_points_ledger (
    user_id,
    activity_type,
    points_earned,
    description,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    NEW.type,
    points_to_award,
    'Activity: ' || NEW.title,
    jsonb_build_object(
      'activity_id', NEW.id,
      'contact_id', NEW.contact_id,
      'activity_type', NEW.type
    ),
    now()
  );

  -- Update leaderboard stats
  PERFORM update_leaderboard_stats(NEW.user_id);

  RETURN NEW;
END;
$function$;

-- Step 2: Clean up incorrect historical data and re-award correct points
-- First, delete incorrect points entries for activities after 2025-09-12
DELETE FROM public.user_points_ledger
WHERE activity_type IN (
  SELECT DISTINCT activity_type FROM public.activity_weights WHERE is_active = true
)
AND created_at > '2025-09-12'::date
AND description LIKE 'Activity:%';

-- Re-award correct points by processing all activities after 2025-09-12
DO $$
DECLARE
  activity_record RECORD;
  weight_val NUMERIC;
  correct_points INTEGER;
BEGIN
  FOR activity_record IN 
    SELECT a.id, a.user_id, a.type, a.title, a.contact_id, a.created_at
    FROM public.activities a
    WHERE a.created_at > '2025-09-12'::date
    ORDER BY a.created_at ASC
  LOOP
    -- Get the weight for this activity type
    SELECT weight INTO weight_val
    FROM public.activity_weights
    WHERE activity_type = activity_record.type AND is_active = true
    LIMIT 1;
    
    -- Default weight if not found
    weight_val := COALESCE(weight_val, 10);
    
    -- Correct points = weight (no multiplication)
    correct_points := weight_val;
    
    -- Insert correct points entry
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      created_at
    ) VALUES (
      activity_record.user_id,
      activity_record.type,
      correct_points,
      'Activity: ' || activity_record.title,
      jsonb_build_object(
        'activity_id', activity_record.id,
        'contact_id', activity_record.contact_id,
        'activity_type', activity_record.type,
        'corrected', true
      ),
      activity_record.created_at
    );
  END LOOP;
END $$;

-- Step 3: Recalculate total_points in leaderboard_stats
UPDATE public.leaderboard_stats ls
SET total_points = COALESCE(
  (SELECT SUM(points_earned) 
   FROM public.user_points_ledger upl 
   WHERE upl.user_id = ls.user_id),
  0
),
last_updated = now();

-- Step 4: Create validation function
CREATE OR REPLACE FUNCTION public.validate_points_integrity()
RETURNS TABLE(
  check_name text,
  status text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check 1: Verify no 10x inflated points exist for recent activities
  RETURN QUERY
  SELECT 
    'inflated_activity_points'::text,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', ARRAY_AGG(id) FILTER (WHERE id IS NOT NULL) 
    )
  FROM public.user_points_ledger
  WHERE activity_type IN ('email', 'call', 'meeting', 'text', 'social_media', 'other')
  AND points_earned > 100
  AND created_at > '2025-09-12'::date;

  -- Check 2: Verify email activities have correct points (should be ~15)
  RETURN QUERY
  SELECT
    'email_points_correct'::text,
    CASE
      WHEN AVG(points_earned) BETWEEN 14 AND 16 THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    jsonb_build_object(
      'average_points', AVG(points_earned),
      'expected', 15,
      'count', COUNT(*)
    )
  FROM public.user_points_ledger
  WHERE activity_type = 'email'
  AND created_at > '2025-09-12'::date
  AND description LIKE 'Activity:%';

  -- Check 3: Verify leaderboard totals match ledger sums
  RETURN QUERY
  SELECT
    'leaderboard_totals_match'::text,
    CASE
      WHEN COUNT(*) = 0 THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    jsonb_build_object(
      'mismatched_users', COUNT(*),
      'sample_user_ids', ARRAY_AGG(user_id) FILTER (WHERE user_id IS NOT NULL)
    )
  FROM (
    SELECT 
      ls.user_id,
      ls.total_points as leaderboard_total,
      COALESCE(SUM(upl.points_earned), 0) as ledger_total
    FROM public.leaderboard_stats ls
    LEFT JOIN public.user_points_ledger upl ON upl.user_id = ls.user_id
    GROUP BY ls.user_id, ls.total_points
    HAVING ls.total_points != COALESCE(SUM(upl.points_earned), 0)
  ) mismatches;

  RETURN;
END;
$function$;

-- Run validation and log results
DO $$
DECLARE
  validation_result RECORD;
BEGIN
  RAISE NOTICE 'Points Integrity Validation Results:';
  RAISE NOTICE '=====================================';
  
  FOR validation_result IN 
    SELECT * FROM public.validate_points_integrity()
  LOOP
    RAISE NOTICE 'Check: % | Status: % | Details: %', 
      validation_result.check_name,
      validation_result.status,
      validation_result.details;
  END LOOP;
END $$;