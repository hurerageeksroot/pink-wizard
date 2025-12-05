-- Complete relationship type seeding system based on user specification
-- This migration creates a comprehensive RPC that seeds all relationship types and statuses
-- when a user enables a category, ensuring dropdowns are immediately populated

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.seed_relationship_types_for_category(uuid, text);

-- Create comprehensive seeding function
CREATE OR REPLACE FUNCTION public.seed_relationship_types_for_category(
  p_user_id uuid,
  p_category_name text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_types_seeded integer := 0;
  v_max_sort_order integer;
BEGIN
  -- Get max sort order for user's existing types
  SELECT COALESCE(MAX(sort_order), 0) INTO v_max_sort_order
  FROM user_relationship_types
  WHERE user_id = p_user_id;

  -- Seed based on category name
  CASE p_category_name
    -- BUSINESS CATEGORY: Lead - Client, Lead - Amplifier, Nurture
    WHEN 'business' THEN
      -- Check if business lead types exist
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'business_lead_statuses'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'lead_client', 'Lead - Client', 'business_lead_statuses', 'Target', 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', true, v_max_sort_order + 1, true),
          (p_user_id, 'lead_amplifier', 'Lead - Amplifier', 'business_lead_statuses', 'Share2', 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800', true, v_max_sort_order + 2, true);
        v_types_seeded := v_types_seeded + 2;
      END IF;

      -- Check if business nurture types exist
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'business_nurture_statuses'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'nurture', 'Nurture', 'business_nurture_statuses', 'Handshake', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', true, v_max_sort_order + 3, false);
        v_types_seeded := v_types_seeded + 1;
      END IF;

    -- PERSONAL CATEGORY: Family, Friend, Acquaintance
    WHEN 'personal' THEN
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'personal_statuses'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'family', 'Family', 'personal_statuses', 'Users', 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', true, v_max_sort_order + 1, false),
          (p_user_id, 'friend', 'Friend', 'personal_statuses', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', true, v_max_sort_order + 2, false),
          (p_user_id, 'acquaintance', 'Acquaintance', 'personal_statuses', 'UserCheck', 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800', true, v_max_sort_order + 3, false);
        v_types_seeded := v_types_seeded + 3;
      END IF;

    -- CIVIC & COMMUNITY CATEGORY: Government, Community Leaders, Civic Organizations
    WHEN 'civic_community' THEN
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'civic_statuses'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'government', 'Government', 'civic_statuses', 'Building', 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', true, v_max_sort_order + 1, false),
          (p_user_id, 'community_leaders', 'Community Leaders', 'civic_statuses', 'Users', 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800', true, v_max_sort_order + 2, false),
          (p_user_id, 'civic_organizations', 'Civic Organizations', 'civic_statuses', 'Building2', 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800', true, v_max_sort_order + 3, false);
        v_types_seeded := v_types_seeded + 3;
      END IF;

    -- SERVICE PROVIDER/VENDOR CATEGORY: Vendors, Suppliers, Service Provider
    WHEN 'service_provider' THEN
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'vendor_statuses'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'vendors', 'Vendors', 'vendor_statuses', 'Truck', 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800', true, v_max_sort_order + 1, false),
          (p_user_id, 'suppliers', 'Suppliers', 'vendor_statuses', 'Package', 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800', true, v_max_sort_order + 2, false),
          (p_user_id, 'service_provider', 'Service Provider', 'vendor_statuses', 'Shield', 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', true, v_max_sort_order + 3, false);
        v_types_seeded := v_types_seeded + 3;
      END IF;

    -- OTHER/MISC CATEGORY
    WHEN 'other_misc' THEN
      IF NOT EXISTS (
        SELECT 1 FROM user_relationship_types
        WHERE user_id = p_user_id AND relationship_intent = 'other_misc'
        LIMIT 1
      ) THEN
        INSERT INTO user_relationship_types (user_id, name, label, relationship_intent, icon_name, color_class, is_default, sort_order, is_lead_type)
        VALUES
          (p_user_id, 'other', 'Other', 'other_misc', 'User', 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800', true, v_max_sort_order + 1, false);
        v_types_seeded := v_types_seeded + 1;
      END IF;

    ELSE
      -- Unknown category
      RETURN 0;
  END CASE;

  RETURN v_types_seeded;
END;
$$;

COMMENT ON FUNCTION public.seed_relationship_types_for_category IS 'Seeds default relationship types when a user enables a category. Based on user specification: Business (Lead-Client, Lead-Amplifier, Nurture), Personal (Family, Friend, Acquaintance), Civic (Government, Community Leaders, Civic Organizations), Vendor (Vendors, Suppliers, Service Provider), Other (Other).';

-- One-time backfill: Seed types for users who have enabled categories but are missing types
DO $$
DECLARE
  v_user record;
  v_count integer := 0;
  v_result integer;
BEGIN
  FOR v_user IN
    SELECT DISTINCT user_id, category_name
    FROM user_relationship_category_preferences
    WHERE is_enabled = true
  LOOP
    v_result := seed_relationship_types_for_category(v_user.user_id, v_user.category_name);
    v_count := v_count + v_result;
  END LOOP;
  
  RAISE NOTICE 'Backfilled % relationship types for enabled categories', v_count;
END $$;