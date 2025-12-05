-- Backfill NULL relationship_status values with defaults based on relationship_intent
-- This fixes existing contacts (88 currently) that have NULL relationship_status

-- Step 1: Update existing contacts with NULL relationship_status
UPDATE contacts c
SET relationship_status = ric.default_status,
    updated_at = now()
FROM user_relationship_types urt
JOIN relationship_intent_configs ric ON urt.relationship_intent::text = ric.intent
WHERE c.relationship_type = urt.name
  AND c.user_id = urt.user_id
  AND c.relationship_status IS NULL
  AND ric.default_status IS NOT NULL;

-- Step 2: Create function to auto-set default relationship_status
CREATE OR REPLACE FUNCTION public.set_default_relationship_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_status text;
BEGIN
  -- Only set default if relationship_status is NULL and relationship_type is provided
  IF NEW.relationship_status IS NULL AND NEW.relationship_type IS NOT NULL THEN
    -- Look up the default status for this relationship type
    SELECT ric.default_status INTO v_default_status
    FROM user_relationship_types urt
    JOIN relationship_intent_configs ric ON urt.relationship_intent::text = ric.intent
    WHERE urt.name = NEW.relationship_type
      AND urt.user_id = NEW.user_id
    LIMIT 1;
    
    -- Set the default if found
    IF v_default_status IS NOT NULL THEN
      NEW.relationship_status := v_default_status;
    ELSE
      -- Fallback to 'new' if no default found
      NEW.relationship_status := 'new';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to run before INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_set_default_relationship_status ON contacts;
CREATE TRIGGER trigger_set_default_relationship_status
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_default_relationship_status();

-- Step 4: Log results
DO $$
DECLARE
  v_null_count integer;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM contacts
  WHERE relationship_status IS NULL;
  
  RAISE NOTICE '✅ Migration complete. Remaining NULL relationship_status records: %', v_null_count;
END $$;