-- Fix follow-up dates that were corrupted by the flawed calculateNextFollowUpDate function
-- This recovers contacts that were set to the suspicious October 7, 2025 date

DO $$
DECLARE
  contact_record RECORD;
  user_settings RECORD;
  new_follow_up_date timestamp with time zone;
  fixed_count integer := 0;
BEGIN
  -- Find contacts with the suspicious October 7, 2025 timestamp
  FOR contact_record IN 
    SELECT c.*, cs.cadences, cs.auto_followup_enabled
    FROM public.contacts c
    LEFT JOIN public.crm_settings cs ON cs.user_id = c.user_id
    WHERE c.next_follow_up::date = '2025-10-07'::date
      AND c.next_follow_up::time >= '13:32:00'::time
      AND c.next_follow_up::time <= '13:33:00'::time
  LOOP
    -- Skip if no CRM settings or auto follow-up disabled
    IF contact_record.cadences IS NULL OR NOT contact_record.auto_followup_enabled THEN
      CONTINUE;
    END IF;

    -- Recalculate proper follow-up date based on relationship type, status, and fallback
    new_follow_up_date := NULL;
    
    -- Check relationship-based cadence first
    IF contact_record.relationship_type IS NOT NULL 
       AND contact_record.cadences ? 'relationship'
       AND (contact_record.cadences->'relationship') ? contact_record.relationship_type
       AND (contact_record.cadences->'relationship'->contact_record.relationship_type->>'enabled')::boolean = true THEN
      
      -- Calculate based on relationship cadence
      DECLARE
        cadence_value integer;
        cadence_unit text;
      BEGIN
        cadence_value := (contact_record.cadences->'relationship'->contact_record.relationship_type->>'value')::integer;
        cadence_unit := contact_record.cadences->'relationship'->contact_record.relationship_type->>'unit';
        
        CASE cadence_unit
          WHEN 'days' THEN
            new_follow_up_date := CASE WHEN cadence_value = 0 THEN now() ELSE now() + (cadence_value || ' days')::interval END;
          WHEN 'weeks' THEN 
            new_follow_up_date := now() + (cadence_value || ' weeks')::interval;
          WHEN 'months' THEN 
            new_follow_up_date := now() + (cadence_value || ' months')::interval;
        END CASE;
      END;
      
    -- Check status-based cadence if no relationship cadence
    ELSIF contact_record.status IS NOT NULL
          AND contact_record.cadences ? 'status'
          AND (contact_record.cadences->'status') ? contact_record.status
          AND (contact_record.cadences->'status'->contact_record.status->>'enabled')::boolean = true THEN
      
      -- Calculate based on status cadence
      DECLARE
        cadence_value integer;
        cadence_unit text;
      BEGIN
        cadence_value := (contact_record.cadences->'status'->contact_record.status->>'value')::integer;
        cadence_unit := contact_record.cadences->'status'->contact_record.status->>'unit';
        
        CASE cadence_unit
          WHEN 'days' THEN
            new_follow_up_date := CASE WHEN cadence_value = 0 THEN now() ELSE now() + (cadence_value || ' days')::interval END;
          WHEN 'weeks' THEN 
            new_follow_up_date := now() + (cadence_value || ' weeks')::interval;
          WHEN 'months' THEN 
            new_follow_up_date := now() + (cadence_value || ' months')::interval;
        END CASE;
      END;
      
    -- Use fallback cadence if available
    ELSIF contact_record.cadences ? 'fallback'
          AND (contact_record.cadences->'fallback'->>'enabled')::boolean = true THEN
      
      -- Calculate based on fallback cadence
      DECLARE
        cadence_value integer;
        cadence_unit text;
      BEGIN
        cadence_value := (contact_record.cadences->'fallback'->>'value')::integer;
        cadence_unit := contact_record.cadences->'fallback'->>'unit';
        
        CASE cadence_unit
          WHEN 'days' THEN
            new_follow_up_date := CASE WHEN cadence_value = 0 THEN now() ELSE now() + (cadence_value || ' days')::interval END;
          WHEN 'weeks' THEN 
            new_follow_up_date := now() + (cadence_value || ' weeks')::interval;
          WHEN 'months' THEN 
            new_follow_up_date := now() + (cadence_value || ' months')::interval;
        END CASE;
      END;
    END IF;

    -- Update the contact with the corrected follow-up date
    IF new_follow_up_date IS NOT NULL THEN
      UPDATE public.contacts
      SET next_follow_up = new_follow_up_date,
          updated_at = now()
      WHERE id = contact_record.id;
      
      fixed_count := fixed_count + 1;
      
      RAISE LOG 'Fixed contact % (%) - changed from % to %', 
        contact_record.name, contact_record.id, contact_record.next_follow_up, new_follow_up_date;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Fixed % contacts with corrupted follow-up dates', fixed_count;
END $$;