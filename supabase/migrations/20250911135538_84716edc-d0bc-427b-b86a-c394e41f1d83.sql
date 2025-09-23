-- Add missing DELETE and write-secured UPDATE policy for user_daily_tasks
CREATE POLICY "Users can delete their own daily tasks" 
ON public.user_daily_tasks 
FOR DELETE 
TO authenticated 
USING ((auth.uid() = user_id) AND user_can_write_secure(auth.uid()));

-- Update the existing UPDATE policy to include write permission check
DROP POLICY IF EXISTS "Users can update their own daily tasks" ON public.user_daily_tasks;

CREATE POLICY "Users can update their own daily tasks with write access" 
ON public.user_daily_tasks 
FOR UPDATE 
TO authenticated 
USING ((auth.uid() = user_id) AND user_can_write_secure(auth.uid()))
WITH CHECK ((auth.uid() = user_id) AND user_can_write_secure(auth.uid()));