-- Fix security warning: Set proper search path for function
CREATE OR REPLACE FUNCTION public.update_user_weekly_tasks_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;