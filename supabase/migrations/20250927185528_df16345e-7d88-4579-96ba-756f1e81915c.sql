-- Create RPC function to seed default relationship types for a user
CREATE OR REPLACE FUNCTION public.seed_default_relationship_types(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert default relationship types for each intent
  INSERT INTO public.user_relationship_types (
    user_id,
    name,
    label,
    icon_name,
    color_class,
    relationship_intent,
    is_default,
    sort_order
  ) VALUES
  -- Business Lead types
  (p_user_id, 'cold_lead', 'Cold Lead', 'Target', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', 'business_lead', true, 1),
  (p_user_id, 'warm_lead', 'Warm Lead', 'Target', 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800', 'business_lead', true, 2),
  (p_user_id, 'hot_lead', 'Hot Lead', 'Target', 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', 'business_lead', true, 3),
  
  -- Business Nurture types  
  (p_user_id, 'past_client', 'Past Client', 'Handshake', 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', 'business_nurture', true, 4),
  (p_user_id, 'referral_source', 'Referral Source', 'Handshake', 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', 'business_nurture', true, 5),
  
  -- Personal Connection types
  (p_user_id, 'friend_family', 'Friend/Family', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', 'personal_connection', true, 6),
  
  -- Service Provider types
  (p_user_id, 'service_provider', 'Service Provider', 'Shield', 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800', 'service_provider', true, 7),
  
  -- Community Member types
  (p_user_id, 'community_member', 'Community Member', 'Users', 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', 'community_member', true, 8)
  
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$function$;