-- Phase 1: Seed missing relationship intent configs and status options (FINAL CORRECTED VERSION)

-- 1. Insert missing relationship intent configs
INSERT INTO public.relationship_intent_configs (intent, label, description, icon_name, default_status, created_at, updated_at)
VALUES
  ('other_misc', 'Other/Misc', 'General contacts that don''t fit other categories', 'Users', 'active', now(), now()),
  ('business_nurture', 'Business Nurture', 'Business relationships to maintain and grow', 'Briefcase', 'active', now(), now()),
  ('media_press', 'Media/Press', 'Media contacts and press relationships', 'Newspaper', 'contacted', now(), now())
ON CONFLICT (intent) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  updated_at = now();

-- 2. Insert comprehensive relationship status options for all intents
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, sort_order, created_at, updated_at)
VALUES
  -- other_misc statuses
  ('other_misc', 'new', 'New', 'Newly added contact', 'bg-blue-100 text-blue-800 border-blue-200', 0, now(), now()),
  ('other_misc', 'active', 'Active', 'Active relationship', 'bg-green-100 text-green-800 border-green-200', 1, now(), now()),
  ('other_misc', 'inactive', 'Inactive', 'Inactive contact', 'bg-gray-100 text-gray-800 border-gray-200', 2, now(), now()),
  
  -- business_nurture statuses
  ('business_nurture', 'new', 'New', 'New business contact', 'bg-blue-100 text-blue-800 border-blue-200', 0, now(), now()),
  ('business_nurture', 'active', 'Active', 'Active business relationship', 'bg-green-100 text-green-800 border-green-200', 1, now(), now()),
  ('business_nurture', 'nurturing', 'Nurturing', 'Ongoing relationship development', 'bg-purple-100 text-purple-800 border-purple-200', 2, now(), now()),
  ('business_nurture', 'paused', 'Paused', 'Temporarily paused', 'bg-gray-100 text-gray-800 border-gray-200', 3, now(), now()),
  
  -- media_press statuses
  ('media_press', 'new', 'New', 'New media contact', 'bg-blue-100 text-blue-800 border-blue-200', 0, now(), now()),
  ('media_press', 'contacted', 'Contacted', 'Initial contact made', 'bg-yellow-100 text-yellow-800 border-yellow-200', 1, now(), now()),
  ('media_press', 'active', 'Active', 'Active media relationship', 'bg-green-100 text-green-800 border-green-200', 2, now(), now()),
  ('media_press', 'inactive', 'Inactive', 'Inactive media contact', 'bg-gray-100 text-gray-800 border-gray-200', 3, now(), now())
ON CONFLICT (intent, status_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  color_class = EXCLUDED.color_class,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- 3. Create function to seed default relationship types for a user WITH PROPER ENUM CASTING
CREATE OR REPLACE FUNCTION public.seed_default_relationship_types_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has relationship types
  IF EXISTS (SELECT 1 FROM public.user_relationship_types WHERE user_id = target_user_id) THEN
    RETURN;
  END IF;
  
  -- Insert default relationship types for the user with proper enum casting
  INSERT INTO public.user_relationship_types (
    user_id, name, label, icon_name, color_class, relationship_intent, is_default, sort_order, created_at, updated_at
  ) VALUES
    -- Business Lead relationships
    (target_user_id, 'cold_lead', 'Cold Lead', 'Target', 'bg-blue-100 text-blue-800 border-blue-200', 'business_lead'::relationship_intent, true, 0, now(), now()),
    (target_user_id, 'warm_lead', 'Warm Lead', 'ArrowRight', 'bg-orange-100 text-orange-800 border-orange-200', 'business_lead'::relationship_intent, true, 1, now(), now()),
    (target_user_id, 'hot_lead', 'Hot Lead', 'Flame', 'bg-red-100 text-red-800 border-red-200', 'business_lead'::relationship_intent, true, 2, now(), now()),
    (target_user_id, 'proposal_sent', 'Proposal Sent', 'FileText', 'bg-purple-100 text-purple-800 border-purple-200', 'business_lead'::relationship_intent, true, 3, now(), now()),
    (target_user_id, 'current_client', 'Current Client', 'Star', 'bg-green-100 text-green-800 border-green-200', 'business_lead'::relationship_intent, true, 4, now(), now()),
    (target_user_id, 'past_client', 'Past Client', 'Clock', 'bg-gray-100 text-gray-800 border-gray-200', 'business_lead'::relationship_intent, true, 5, now(), now()),
    (target_user_id, 'lost_not_fit', 'Lost - Not a Fit', 'XCircle', 'bg-red-100 text-red-800 border-red-200', 'business_lead'::relationship_intent, true, 6, now(), now()),
    (target_user_id, 'lost_maybe_later', 'Lost - Maybe Later', 'Clock', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'business_lead'::relationship_intent, true, 7, now(), now()),
    
    -- Business Nurture relationships
    (target_user_id, 'referral', 'Referral Source', 'Share2', 'bg-teal-100 text-teal-800 border-teal-200', 'business_nurture'::relationship_intent, true, 8, now(), now()),
    (target_user_id, 'partner', 'Partner/Associate', 'Handshake', 'bg-indigo-100 text-indigo-800 border-indigo-200', 'business_nurture'::relationship_intent, true, 9, now(), now()),
    
    -- Personal relationships
    (target_user_id, 'friend', 'Friend/Family', 'Heart', 'bg-pink-100 text-pink-800 border-pink-200', 'personal_connection'::relationship_intent, true, 10, now(), now()),
    
    -- Other/Misc
    (target_user_id, 'general_contact', 'General Contact', 'Users', 'bg-gray-100 text-gray-800 border-gray-200', 'other_misc'::relationship_intent, true, 11, now(), now());
END;
$$;

-- 4. Seed relationship types for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_default_relationship_types_for_user(user_record.id);
  END LOOP;
END $$;

-- 5. Create trigger to auto-seed relationship types for new users
CREATE OR REPLACE FUNCTION public.auto_seed_relationship_types_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_relationship_types_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_seed_relationship_types ON public.profiles;

CREATE TRIGGER trigger_auto_seed_relationship_types
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_seed_relationship_types_on_profile_creation();