-- Create trigger to auto-complete networking program tasks
CREATE TRIGGER trigger_auto_complete_networking_program_tasks
  AFTER INSERT ON public.networking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_networking_program_tasks();