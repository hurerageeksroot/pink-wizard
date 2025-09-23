-- Backfill missing points for existing activities and contacts

-- Function to backfill missing activity points
CREATE OR REPLACE FUNCTION public.backfill_missing_activity_points()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  activity_record RECORD;
  total_activities_processed INTEGER := 0;
  total_points_awarded INTEGER := 0;
  weight_multiplier NUMERIC;
  points_earned INTEGER;
BEGIN
  -- Process all activities that don't have corresponding points ledger entries
  FOR activity_record IN 
    SELECT a.id, a.user_id, a.type, a.title, a.contact_id, a.response_received, a.created_at
    FROM activities a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_points_ledger upl 
      WHERE upl.user_id = a.user_id 
      AND upl.metadata->>'activity_id' = a.id::text
    )
    AND a.created_at >= '2025-09-01'  -- Only backfill recent activities
  LOOP
    -- Get weight for this activity type
    SELECT weight INTO weight_multiplier
    FROM public.activity_weights 
    WHERE activity_type = activity_record.type AND is_active = true
    LIMIT 1;
    
    -- Default to 10 points if no weight found
    weight_multiplier := COALESCE(weight_multiplier, 10.0);
    points_earned := weight_multiplier::INTEGER;
    
    -- Award points using our standardized function
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
      points_earned,
      'BACKFILL: Activity: ' || activity_record.title,
      jsonb_build_object(
        'activity_id', activity_record.id,
        'contact_id', activity_record.contact_id,
        'response_received', activity_record.response_received,
        'backfill_source', 'missing_activity_points',
        'backfill_date', now()
      ),
      activity_record.created_at  -- Use original activity date
    );
    
    total_activities_processed := total_activities_processed + 1;
    total_points_awarded := total_points_awarded + points_earned;
  END LOOP;
  
  RETURN jsonb_build_object(
    'activities_processed', total_activities_processed,
    'total_points_awarded', total_points_awarded,
    'message', 'Activity points backfill completed'
  );
END;
$$;

-- Function to backfill missing contact points  
CREATE OR REPLACE FUNCTION public.backfill_missing_contact_points()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contact_record RECORD;
  total_contacts_processed INTEGER := 0;
  total_points_awarded INTEGER := 0;
  points_earned INTEGER := 10; -- contact_added weight
BEGIN
  -- Process all contacts that don't have corresponding points ledger entries
  FOR contact_record IN 
    SELECT c.id, c.user_id, c.name, c.company, c.status, c.created_at
    FROM contacts c
    WHERE NOT EXISTS (
      SELECT 1 FROM user_points_ledger upl 
      WHERE upl.user_id = c.user_id 
      AND upl.activity_type = 'contact_added'
      AND upl.metadata->>'contact_id' = c.id::text
    )
    AND c.is_demo = false  -- Skip demo contacts
    AND c.created_at >= '2025-09-01'  -- Only backfill recent contacts
  LOOP
    -- Award points for contact
    INSERT INTO public.user_points_ledger (
      user_id,
      activity_type,
      points_earned,
      description,
      metadata,
      created_at
    ) VALUES (
      contact_record.user_id,
      'contact_added',
      points_earned,
      'BACKFILL: New contact: ' || contact_record.name,
      jsonb_build_object(
        'contact_id', contact_record.id,
        'company', contact_record.company,
        'status', contact_record.status,
        'backfill_source', 'missing_contact_points',
        'backfill_date', now()
      ),
      contact_record.created_at  -- Use original contact date
    );
    
    total_contacts_processed := total_contacts_processed + 1;
    total_points_awarded := total_points_awarded + points_earned;
  END LOOP;
  
  RETURN jsonb_build_object(
    'contacts_processed', total_contacts_processed,
    'total_points_awarded', total_points_awarded,
    'message', 'Contact points backfill completed'
  );
END;
$$;

-- Execute the backfill (can be run by admins)
SELECT public.backfill_missing_activity_points() as activity_backfill_result;
SELECT public.backfill_missing_contact_points() as contact_backfill_result;