-- ============================================================================
-- COMPREHENSIVE POINTS SYSTEM FIX
-- Backfills missing activity points and creates automatic point awarding
-- ============================================================================

-- Step 1: Create trigger function to automatically award points for activities
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weight_multiplier NUMERIC;
  points_to_award NUMERIC := 0;
  activity_description TEXT;
  revenue_amount NUMERIC := 0;
BEGIN
  -- Get weight for this activity type from activity_weights table
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = NEW.type AND is_active = true
  LIMIT 1;
  
  -- Default to 1.0 if no weight found
  weight_multiplier := COALESCE(weight_multiplier, 1.0);
  
  -- Base points calculation
  points_to_award := 10 * weight_multiplier;
  
  -- Special handling for revenue logging
  IF NEW.type = 'revenue' THEN
    -- Get revenue amount from associated contact
    SELECT COALESCE(c.revenue_amount, 0) INTO revenue_amount
    FROM public.contacts c
    WHERE c.id = NEW.contact_id;
    
    -- 100 points per $1000 in revenue
    points_to_award := (revenue_amount / 1000) * 100;
  END IF;
  
  -- Build description
  activity_description := 'Activity: ' || NEW.title;
  IF NEW.type = 'revenue' THEN
    activity_description := 'Revenue logged: $' || revenue_amount::text;
  END IF;
  
  -- Award points only if we haven't already awarded for this activity
  IF NOT EXISTS (
    SELECT 1 FROM public.user_points_ledger 
    WHERE user_id = NEW.user_id 
    AND metadata->>'activity_id' = NEW.id::text
  ) THEN
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
      activity_description,
      jsonb_build_object(
        'activity_id', NEW.id,
        'activity_type', NEW.type,
        'weight', weight_multiplier
      ),
      NEW.created_at
    );
  END IF;
  
  -- Bonus points for response received (only on update when response changes)
  IF TG_OP = 'UPDATE' AND NEW.response_received = true AND OLD.response_received = false THEN
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.user_id,
      'response_bonus',
      25,
      'Response received bonus',
      jsonb_build_object('activity_id', NEW.id),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 2: Create trigger on activities table
DROP TRIGGER IF EXISTS trigger_award_activity_points ON public.activities;
CREATE TRIGGER trigger_award_activity_points
AFTER INSERT OR UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.award_activity_points();

-- Step 3: Backfill all missing points for existing activities
DO $$
DECLARE
  activity_record RECORD;
  weight_multiplier NUMERIC;
  points_to_award NUMERIC;
  activity_description TEXT;
  revenue_amount NUMERIC;
  total_backfilled INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting points backfill for all users...';
  
  -- Loop through all activities that don't have corresponding points
  FOR activity_record IN 
    SELECT a.*
    FROM public.activities a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_points_ledger upl
      WHERE upl.user_id = a.user_id 
      AND upl.metadata->>'activity_id' = a.id::text
    )
    ORDER BY a.created_at
  LOOP
    -- Get weight for this activity type
    SELECT weight INTO weight_multiplier
    FROM public.activity_weights 
    WHERE activity_type = activity_record.type AND is_active = true
    LIMIT 1;
    
    weight_multiplier := COALESCE(weight_multiplier, 1.0);
    points_to_award := 10 * weight_multiplier;
    
    -- Special handling for revenue
    IF activity_record.type = 'revenue' THEN
      SELECT COALESCE(c.revenue_amount, 0) INTO revenue_amount
      FROM public.contacts c
      WHERE c.id = activity_record.contact_id;
      
      points_to_award := (revenue_amount / 1000) * 100;
      activity_description := 'Revenue logged: $' || revenue_amount::text;
    ELSE
      activity_description := 'Activity: ' || activity_record.title;
    END IF;
    
    -- Insert backfilled points
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
      points_to_award,
      activity_description,
      jsonb_build_object(
        'activity_id', activity_record.id,
        'activity_type', activity_record.type,
        'weight', weight_multiplier,
        'backfilled', true
      ),
      activity_record.created_at
    );
    
    total_backfilled := total_backfilled + 1;
    
    -- Also backfill response bonus if applicable
    IF activity_record.response_received = true THEN
      INSERT INTO public.user_points_ledger (
        user_id,
        activity_type,
        points_earned,
        description,
        metadata,
        created_at
      ) VALUES (
        activity_record.user_id,
        'response_bonus',
        25,
        'Response received bonus (backfilled)',
        jsonb_build_object(
          'activity_id', activity_record.id,
          'backfilled', true
        ),
        activity_record.completed_at
      );
      
      total_backfilled := total_backfilled + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete! Awarded points for % activities', total_backfilled;
END $$;

-- Step 4: Add index for faster metadata lookups
CREATE INDEX IF NOT EXISTS idx_points_ledger_activity_metadata 
ON public.user_points_ledger USING gin(metadata);