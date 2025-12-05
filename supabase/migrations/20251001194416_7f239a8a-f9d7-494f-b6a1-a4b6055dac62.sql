-- Update the seed_default_relationship_types function to use new business relationship types
CREATE OR REPLACE FUNCTION public.seed_default_relationship_types(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user already has relationship types
  IF EXISTS (SELECT 1 FROM public.user_relationship_types WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;
  
  -- Insert default Business Lead relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_lead_type, is_default, sort_order)
  VALUES
    (p_user_id, 'lead_client', 'Lead - Client', 'Target', 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', 'business_lead', true, true, 1),
    (p_user_id, 'lead_amplifier', 'Lead - Amplifier', 'Megaphone', 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', 'business_lead', true, true, 2);
  
  -- Insert default Business Nurture relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_lead_type, is_default, sort_order)
  VALUES
    (p_user_id, 'client', 'Client', 'Briefcase', 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', 'business_nurture', false, true, 3),
    (p_user_id, 'strategic_partner', 'Strategic Partner', 'Handshake', 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800', 'business_nurture', false, true, 4),
    (p_user_id, 'associate_colleague', 'Associate / Colleague', 'Users', 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800', 'business_nurture', false, true, 5),
    (p_user_id, 'staff', 'Staff', 'UserCheck', 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800', 'business_nurture', false, true, 6),
    (p_user_id, 'volunteer', 'Volunteer', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', 'business_nurture', false, true, 7),
    (p_user_id, 'donor', 'Donor', 'Gift', 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', 'business_nurture', false, true, 8);
  
  -- Insert default Personal relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_lead_type, is_default, sort_order)
  VALUES
    (p_user_id, 'inner_circle', 'Inner Circle', 'Heart', 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800', 'personal', false, true, 9),
    (p_user_id, 'close_circle', 'Close Circle', 'Users', 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', 'personal', false, true, 10),
    (p_user_id, 'outer_circle', 'Outer Circle', 'UserPlus', 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800', 'personal', false, true, 11),
    (p_user_id, 'friendly_not_close', 'Friendly (Not Close)', 'Smile', 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800', 'personal', false, true, 12),
    (p_user_id, 'past_connection', 'Past Connection', 'Clock', 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800', 'personal', false, true, 13);
  
  -- Insert default Civic/Community relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_lead_type, is_default, sort_order)
  VALUES
    (p_user_id, 'trusted', 'Trusted', 'ShieldCheck', 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', 'civic', false, true, 14),
    (p_user_id, 'connected', 'Connected', 'Link', 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800', 'civic', false, true, 15),
    (p_user_id, 'new_civic', 'New', 'Sparkles', 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800', 'civic', false, true, 16),
    (p_user_id, 'unaligned', 'Unaligned', 'AlertCircle', 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', 'civic', false, true, 17);
  
  -- Insert default Vendor relationship types
  INSERT INTO public.user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_lead_type, is_default, sort_order)
  VALUES
    (p_user_id, 'preferred', 'Preferred', 'Star', 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', 'vendor', false, true, 18),
    (p_user_id, 'active', 'Active', 'CheckCircle', 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', 'vendor', false, true, 19),
    (p_user_id, 'potential', 'Potential', 'Eye', 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800', 'vendor', false, true, 20);
END;
$function$;

-- Migrate contacts for business_lead -> lead_client
UPDATE public.contacts c
SET relationship_type = 'lead_client'
FROM public.user_relationship_types urt
WHERE c.relationship_type IN ('business_lead', 'lead')
  AND urt.user_id = c.user_id
  AND urt.name = 'lead_client';

-- Migrate contacts for current_client/past_client -> client (only where client type exists)
UPDATE public.contacts c
SET relationship_type = 'client'
FROM public.user_relationship_types urt
WHERE c.relationship_type IN ('current_client', 'past_client')
  AND urt.user_id = c.user_id
  AND urt.name = 'client';

-- Migrate contacts for current_amplifier -> lead_amplifier
UPDATE public.contacts c
SET relationship_type = 'lead_amplifier'
FROM public.user_relationship_types urt
WHERE c.relationship_type = 'current_amplifier'
  AND urt.user_id = c.user_id
  AND urt.name = 'lead_amplifier';

-- Migrate contacts for associate_partner -> associate_colleague
UPDATE public.contacts c
SET relationship_type = 'associate_colleague'
FROM public.user_relationship_types urt
WHERE c.relationship_type = 'associate_partner'
  AND urt.user_id = c.user_id
  AND urt.name = 'associate_colleague';

-- Migrate contacts for past_donor -> donor (only where donor type exists)
UPDATE public.contacts c
SET relationship_type = 'donor'
FROM public.user_relationship_types urt
WHERE c.relationship_type = 'past_donor'
  AND urt.user_id = c.user_id
  AND urt.name = 'donor';

-- Now safely delete old relationship types that are no longer in use
DELETE FROM public.user_relationship_types
WHERE name IN ('business_lead', 'lead', 'current_client', 'past_client', 'current_amplifier', 'associate_partner', 'past_donor')
  AND NOT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.relationship_type = user_relationship_types.name
      AND c.user_id = user_relationship_types.user_id
  );

-- Update labels for existing types to match new convention
UPDATE public.user_relationship_types
SET label = 'Lead - Client'
WHERE name = 'lead_client';

UPDATE public.user_relationship_types
SET label = 'Lead - Amplifier'
WHERE name = 'lead_amplifier';

UPDATE public.user_relationship_types
SET label = 'Associate / Colleague'
WHERE name = 'associate_colleague';