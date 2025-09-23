-- Seed default categories for existing users who don't have categories yet
DO $$ 
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all existing profiles that don't have categories
  FOR user_record IN 
    SELECT DISTINCT p.id 
    FROM profiles p 
    LEFT JOIN user_contact_categories ucc ON p.id = ucc.user_id 
    WHERE ucc.user_id IS NULL
  LOOP
    -- Seed default categories for this user
    PERFORM public.seed_default_categories(user_record.id);
  END LOOP;
END $$;