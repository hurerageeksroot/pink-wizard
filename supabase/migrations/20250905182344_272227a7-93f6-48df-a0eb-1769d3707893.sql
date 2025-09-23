-- Create trigger to award points for activities/touchpoints
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award points for logging a touchpoint/activity
  PERFORM public.award_points(
    NEW.user_id,
    'touchpoint_logged',
    'Logged touchpoint: ' || NEW.title,
    jsonb_build_object('activity_id', NEW.id, 'contact_id', NEW.contact_id, 'activity_type', NEW.type)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for activities
CREATE OR REPLACE TRIGGER award_activity_points_trigger
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.award_activity_points();