-- Create function to seed default contact contexts
CREATE OR REPLACE FUNCTION public.seed_default_contact_contexts(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has contexts
  IF EXISTS (SELECT 1 FROM public.contact_contexts WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;
  
  -- Insert default contexts
  INSERT INTO public.contact_contexts (user_id, name, label, icon_name, color_class, is_default, sort_order)
  VALUES 
    (p_user_id, 'general', 'General', 'User', 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800', true, 1),
    (p_user_id, 'business', 'Business', 'Briefcase', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', true, 2),
    (p_user_id, 'networking', 'Networking', 'Users', 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', true, 3),
    (p_user_id, 'referral_source', 'Referral Source', 'Share2', 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', true, 4),
    (p_user_id, 'personal', 'Personal', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', true, 5),
    (p_user_id, 'family', 'Family', 'Home', 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', true, 6);
END;
$$;