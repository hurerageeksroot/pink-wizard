-- Update the user creation trigger to NOT automatically enroll users in challenges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- Create profile with combined name
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(
      TRIM(
        CONCAT(
          COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
          ' ',
          COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
        )
      ),
      NEW.raw_user_meta_data ->> 'name',
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize challenge progress but set is_active to FALSE by default
  -- Users must explicitly opt-in to challenges
  INSERT INTO public.user_challenge_progress (user_id, is_active)
  VALUES (NEW.id, FALSE)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize onboarding tasks for new users
  INSERT INTO public.user_onboarding_tasks (user_id, task_id, completed)
  SELECT 
    NEW.id,
    otd.id,
    false
  FROM public.onboarding_tasks_definition otd
  WHERE otd.is_active = true
  ON CONFLICT (user_id, task_id) DO NOTHING;
  
  -- Don't create daily tasks automatically since user is not enrolled in challenge
  -- Daily tasks will be created when user opts into challenge
  
  RETURN NEW;
END;
$$;