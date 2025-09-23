-- Fix the user_weekly_tasks RLS policy for INSERT operations
-- The current policy has no WITH CHECK condition which causes violations

-- Drop the current incomplete policy
DROP POLICY IF EXISTS "Users can create their weekly tasks" ON public.user_weekly_tasks;

-- Create a proper INSERT policy with WITH CHECK condition
CREATE POLICY "Users can create their weekly tasks" 
ON public.user_weekly_tasks 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND public.user_can_write());

-- Also ensure there's a DELETE policy for completeness  
CREATE POLICY "Users can delete their weekly tasks" 
ON public.user_weekly_tasks 
FOR DELETE 
USING ((auth.uid() = user_id) AND public.user_can_write());