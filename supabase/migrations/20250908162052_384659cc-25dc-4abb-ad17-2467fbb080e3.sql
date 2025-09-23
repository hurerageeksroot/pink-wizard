-- Create function to remove demo data for authenticated users
CREATE OR REPLACE FUNCTION remove_demo_data_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete activities for demo contacts first (to maintain referential integrity)
  DELETE FROM activities 
  WHERE user_id = auth.uid() 
    AND contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.uid() 
        AND is_demo = true
    );

  -- Delete demo contacts
  DELETE FROM contacts 
  WHERE user_id = auth.uid() 
    AND is_demo = true;

  -- Also delete any demo activities that don't have a contact (orphaned demo activities)
  DELETE FROM activities
  WHERE user_id = auth.uid()
    AND (
      title ILIKE '%demo%' OR 
      title ILIKE '%test%' OR 
      title ILIKE '%sample%' OR
      description ILIKE '%demo%' OR 
      description ILIKE '%test%' OR 
      description ILIKE '%sample%'
    );
END;
$$;