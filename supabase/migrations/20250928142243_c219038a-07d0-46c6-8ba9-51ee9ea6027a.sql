-- Now add missing relationship types for existing users
CREATE OR REPLACE FUNCTION add_missing_relationship_types_for_existing_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users who have existing relationship types 
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM user_relationship_types 
  LOOP
    -- Add Civic & Community types
    INSERT INTO user_relationship_types (
      user_id, name, label, icon_name, color_class, relationship_intent,
      is_lead_type, is_default, sort_order, created_at, updated_at
    ) 
    VALUES 
      (user_record.user_id, 'civic_leader', 'Civic Leader', 'Building', 
       'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
       'civic_engagement', false, true, 9, now(), now()),
      (user_record.user_id, 'community_member', 'Community Member', 'Users',
       'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
       'civic_engagement', false, true, 10, now(), now())
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Add Philanthropy & Nonprofits types
    INSERT INTO user_relationship_types (
      user_id, name, label, icon_name, color_class, relationship_intent,
      is_lead_type, is_default, sort_order, created_at, updated_at
    ) 
    VALUES 
      (user_record.user_id, 'donor', 'Donor', 'Gift',
       'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
       'philanthropy_nonprofit', false, true, 11, now(), now()),
      (user_record.user_id, 'volunteer', 'Volunteer', 'HandHeart',
       'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
       'philanthropy_nonprofit', false, true, 12, now(), now())
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Add Service Provider types  
    INSERT INTO user_relationship_types (
      user_id, name, label, icon_name, color_class, relationship_intent,
      is_lead_type, is_default, sort_order, created_at, updated_at
    ) 
    VALUES 
      (user_record.user_id, 'service_provider', 'Service Provider', 'Shield',
       'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
       'service_provider', false, true, 13, now(), now()),
      (user_record.user_id, 'vendor', 'Vendor', 'Truck',
       'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
       'service_provider', false, true, 14, now(), now())
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Add Media & Press types
    INSERT INTO user_relationship_types (
      user_id, name, label, icon_name, color_class, relationship_intent,
      is_lead_type, is_default, sort_order, created_at, updated_at
    ) 
    VALUES 
      (user_record.user_id, 'media_contact', 'Media Contact', 'Newspaper',
       'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
       'media_press', false, true, 15, now(), now()),
      (user_record.user_id, 'journalist', 'Journalist', 'PenTool',
       'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
       'media_press', false, true, 16, now(), now())
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Add Other/Misc types
    INSERT INTO user_relationship_types (
      user_id, name, label, icon_name, color_class, relationship_intent,
      is_lead_type, is_default, sort_order, created_at, updated_at
    ) 
    VALUES 
      (user_record.user_id, 'general_contact', 'General Contact', 'User',
       'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
       'other_misc', false, true, 17, now(), now())
    ON CONFLICT (user_id, name) DO NOTHING;
    
  END LOOP;
END;
$$;

-- Execute the function
SELECT add_missing_relationship_types_for_existing_users();

-- Clean up the temporary function
DROP FUNCTION add_missing_relationship_types_for_existing_users();