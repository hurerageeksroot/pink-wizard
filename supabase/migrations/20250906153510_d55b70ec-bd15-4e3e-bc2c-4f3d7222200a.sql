-- Fix security issues by setting search_path for functions

-- Update seed_default_categories function with proper search_path
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Update handle_new_user_categories function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_categories(NEW.id);
  RETURN NEW;
END;
$$;