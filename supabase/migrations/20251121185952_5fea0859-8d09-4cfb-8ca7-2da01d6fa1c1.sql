-- Add sidebar behavior preference to profiles
ALTER TABLE profiles 
ADD COLUMN sidebar_click_to_expand BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.sidebar_click_to_expand IS 'When true, sidebar expands on click. When false, sidebar expands on hover.';