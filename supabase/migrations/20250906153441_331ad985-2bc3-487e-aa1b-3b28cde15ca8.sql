-- Create user_contact_categories table for managing custom categories
CREATE TABLE public.user_contact_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'HelpCircle',
  color_class TEXT NOT NULL DEFAULT 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.user_contact_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categories"
ON public.user_contact_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON public.user_contact_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.user_contact_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.user_contact_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to seed default categories for new users
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_contact_categories (user_id, name, label, icon_name, color_class, is_default)
  VALUES 
    (p_user_id, 'uncategorized', 'Uncategorized', 'HelpCircle', 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', true),
    (p_user_id, 'corporate_planner', 'Corporate Planner', 'Building2', 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', true),
    (p_user_id, 'wedding_planner', 'Wedding Planner', 'Heart', 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100', true),
    (p_user_id, 'caterer', 'Caterer', 'ChefHat', 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', true),
    (p_user_id, 'dj', 'DJ', 'Music', 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', true),
    (p_user_id, 'photographer', 'Photographer', 'Camera', 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', true),
    (p_user_id, 'hr', 'HR', 'Users', 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', true),
    (p_user_id, 'venue', 'Venue', 'MapPin', 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100', true),
    (p_user_id, 'hoa_leasing', 'HOA/Leasing', 'Home', 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', true),
    (p_user_id, 'creator', 'Creator', 'Sparkles', 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100', true),
    (p_user_id, 'other', 'Other', 'HelpCircle', 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to seed categories for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.seed_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_seed_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_categories();

-- Update existing contacts to use 'uncategorized' if they have non-existent categories
-- This will be handled in the application code to maintain data integrity