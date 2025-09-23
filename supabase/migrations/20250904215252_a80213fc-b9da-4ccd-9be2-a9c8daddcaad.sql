-- Add the missing foreign key relationship for weekly tasks
-- This fixes the "Could not find a relationship" error

ALTER TABLE public.user_weekly_tasks 
ADD CONSTRAINT user_weekly_tasks_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES public.weekly_tasks_definition(id) 
ON DELETE CASCADE;