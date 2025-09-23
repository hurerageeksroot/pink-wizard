-- Fix search path security issue in the backfill function
CREATE OR REPLACE FUNCTION public.backfill_contact_added_points()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contacts_cursor CURSOR FOR
    SELECT c.id as contact_id, c.user_id, c.name, c.created_at
    FROM public.contacts c
    WHERE c.created_at >= now() - INTERVAL '14 days'  -- Only backfill last 14 days
      AND c.is_demo = false  -- Skip demo contacts
      AND NOT EXISTS (
        SELECT 1 FROM public.user_points_ledger upl
        WHERE upl.user_id = c.user_id
          AND upl.activity_type = 'contact_added'
          AND upl.metadata->>'contact_id' = c.id::text
      );
  
  contact_record RECORD;
  backfilled_count INTEGER := 0;
BEGIN
  -- Log the start of backfill process
  RAISE NOTICE 'Starting backfill of contact_added points...';
  
  FOR contact_record IN contacts_cursor LOOP
    BEGIN
      -- Use the existing award_points function for consistency
      PERFORM public.award_points(
        contact_record.user_id,
        'contact_added',
        'Backfilled: Added contact: ' || contact_record.name,
        jsonb_build_object(
          'contact_id', contact_record.contact_id,
          'contact_name', contact_record.name,
          'backfilled', true,
          'original_date', contact_record.created_at
        )
      );
      
      backfilled_count := backfilled_count + 1;
      
      RAISE NOTICE 'Backfilled points for contact: % (ID: %)', contact_record.name, contact_record.contact_id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log but continue on errors (e.g., duplicate prevention)
      RAISE NOTICE 'Failed to backfill points for contact % (ID: %): %', contact_record.name, contact_record.contact_id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfill completed. Backfilled % contact_added point entries.', backfilled_count;
  
  RETURN backfilled_count;
END;
$$;