-- Fix demo contact detection to exclude notes field
-- Notes are user-generated and often contain words like "demo", "test", "example" in legitimate business context

CREATE OR REPLACE FUNCTION public.is_demo_contact(
  p_email   text,
  p_source  text,
  p_notes   text,  -- Keep parameter for backward compatibility but don't use it
  p_company text,
  p_name    text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_email   text := lower(coalesce(p_email, ''));
  v_source  text := lower(coalesce(p_source, ''));
  v_company text := lower(coalesce(p_company, ''));
  v_name    text := lower(coalesce(p_name, ''));
BEGIN
  IF
    -- Email indicators
    v_email ~ '(demo|test|noreply|no-reply|donotreply)'
    OR v_email LIKE '%@mailinator%'
    OR v_email LIKE '%@10minutemail%'
    OR v_email LIKE '%@guerrillamail%'
    OR v_email LIKE '%example.com%'
    OR v_email LIKE '%@sample%'
    OR v_email LIKE '%@fake%'
    OR v_email LIKE '%@dummy%'

    -- Source indicators
    OR v_source ~ '(demo|test|seed|sample|example|fake)'

    -- Company indicators (removed 'demo' since "Demo Day" is legitimate)
    OR v_company ~ '(test|sample|example)'
    OR v_company LIKE '%fake corp%'
    OR v_company LIKE '%acme corp%'
    OR v_company LIKE '%test company%'

    -- Name indicators
    OR v_name ~ '(demo|test user|sample|example)'
  THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.is_demo_contact IS 'Detects demo/test contacts. IMPORTANT: Does not check notes field to avoid false positives from legitimate business content like "met to demo product".';

-- Backfill all existing contacts to recalculate is_demo flag
-- This will automatically fix false positives like Brandon Smith
UPDATE public.contacts
SET is_demo = public.is_demo_contact(email, source, notes, company, name)
WHERE is_demo = true;

-- Log the results
DO $$
DECLARE
  v_fixed_count integer;
BEGIN
  SELECT COUNT(*) INTO v_fixed_count
  FROM public.contacts
  WHERE is_demo = false
  AND (
    lower(coalesce(notes, '')) ~ '(demo|test|sample|example|fake|generated)'
    OR lower(coalesce(notes, '')) LIKE '%demo%'
  );
  
  RAISE NOTICE 'Fixed % contacts that were false positives due to notes content', v_fixed_count;
END $$;