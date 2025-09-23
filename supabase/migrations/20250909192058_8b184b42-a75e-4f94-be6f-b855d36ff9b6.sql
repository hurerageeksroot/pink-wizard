-- Create trigger function to update progress when activities are added
CREATE OR REPLACE FUNCTION public.trigger_daily_progress_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if this is a new activity for today
  IF NEW.created_at::date = CURRENT_DATE THEN
    PERFORM public.update_daily_challenge_progress();
  END IF;
  
  RETURN NEW;
END;
$function$

-- Add trigger to activities table (drop first if exists)
DROP TRIGGER IF EXISTS activity_progress_update_trigger ON public.activities;
CREATE TRIGGER activity_progress_update_trigger
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_daily_progress_update();