-- Update the initialize_default_relationship_categories function to match CATEGORY_CONFIGS defaults
CREATE OR REPLACE FUNCTION public.initialize_default_relationship_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default categories with proper defaults matching CATEGORY_CONFIGS
  -- business, personal, service_provider, and other_misc are enabled by default
  -- civic_community, philanthropy_nonprofit, and media_press are disabled by default
  INSERT INTO public.user_relationship_category_preferences (
    user_id, category_name, category_label, is_enabled, display_order
  ) VALUES 
    (p_user_id, 'business', 'Business', true, 1),
    (p_user_id, 'personal', 'Personal', true, 2),
    (p_user_id, 'service_provider', 'Service Provider/Vendor', true, 3),
    (p_user_id, 'other_misc', 'Other / Misc', true, 4),
    (p_user_id, 'civic_community', 'Civic & Community', false, 5),
    (p_user_id, 'philanthropy_nonprofit', 'Philanthropy & Nonprofits', false, 6),
    (p_user_id, 'media_press', 'Media & Press', false, 7)
  ON CONFLICT (user_id, category_name) DO NOTHING;
END;
$$;