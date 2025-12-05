-- Create user relationship category preferences table
CREATE TABLE public.user_relationship_category_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_label TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  custom_color_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);

-- Enable RLS
ALTER TABLE public.user_relationship_category_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own category preferences"
ON public.user_relationship_category_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category preferences"
ON public.user_relationship_category_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category preferences"
ON public.user_relationship_category_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category preferences"
ON public.user_relationship_category_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_relationship_category_preferences_updated_at
BEFORE UPDATE ON public.user_relationship_category_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize default categories for new users
CREATE OR REPLACE FUNCTION public.initialize_default_relationship_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default categories (Business and Personal only by default)
  INSERT INTO public.user_relationship_category_preferences (
    user_id, category_name, category_label, is_enabled, display_order
  ) VALUES 
    (p_user_id, 'business', 'Business', true, 1),
    (p_user_id, 'personal', 'Personal', true, 2),
    (p_user_id, 'civic_community', 'Civic & Community', false, 3),
    (p_user_id, 'philanthropy_nonprofit', 'Philanthropy & Nonprofits', false, 4),
    (p_user_id, 'service_provider', 'Service Providers / Vendors', false, 5),
    (p_user_id, 'media_press', 'Media & Press', false, 6),
    (p_user_id, 'other_misc', 'Other / Misc', false, 7)
  ON CONFLICT (user_id, category_name) DO NOTHING;
END;
$$;

-- Migrate existing users to have all categories enabled (backward compatibility)
INSERT INTO public.user_relationship_category_preferences (
  user_id, category_name, category_label, is_enabled, display_order
)
SELECT DISTINCT 
  user_id,
  UNNEST(ARRAY['business', 'personal', 'civic_community', 'philanthropy_nonprofit', 'service_provider', 'media_press', 'other_misc']),
  UNNEST(ARRAY['Business', 'Personal', 'Civic & Community', 'Philanthropy & Nonprofits', 'Service Providers / Vendors', 'Media & Press', 'Other / Misc']),
  true,
  UNNEST(ARRAY[1, 2, 3, 4, 5, 6, 7])
FROM public.user_relationship_types
ON CONFLICT (user_id, category_name) DO NOTHING;