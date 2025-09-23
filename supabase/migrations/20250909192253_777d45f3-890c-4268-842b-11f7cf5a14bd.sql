-- Add trigger to activities table
DO $$ 
BEGIN
    -- Drop trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'activity_progress_update_trigger') THEN
        DROP TRIGGER activity_progress_update_trigger ON public.activities;
    END IF;
    
    -- Create the trigger
    CREATE TRIGGER activity_progress_update_trigger
      AFTER INSERT ON public.activities
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_daily_progress_update();
END $$;