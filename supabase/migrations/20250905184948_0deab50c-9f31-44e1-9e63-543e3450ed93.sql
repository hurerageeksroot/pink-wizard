-- Fix the is_admin function - it had a bug where it was comparing user_id = user_id_param instead of using auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = COALESCE(user_id_param, auth.uid())
      AND role = 'admin'
  );
$$;

-- Also, let's simplify the task definition RLS policies to use the corrected admin function
-- Update daily_tasks_definition policies
DROP POLICY IF EXISTS "Verified admins can manage daily task definitions" ON public.daily_tasks_definition;
CREATE POLICY "Admins can manage daily task definitions" 
ON public.daily_tasks_definition 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update weekly_tasks_definition policies  
DROP POLICY IF EXISTS "Verified admins can manage weekly task definitions" ON public.weekly_tasks_definition;
CREATE POLICY "Admins can manage weekly task definitions" 
ON public.weekly_tasks_definition 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update program_tasks_definition policies
DROP POLICY IF EXISTS "Verified admins can manage program task definitions" ON public.program_tasks_definition;
CREATE POLICY "Admins can manage program task definitions" 
ON public.program_tasks_definition 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update onboarding_tasks_definition policies
DROP POLICY IF EXISTS "Verified admins can manage onboarding task definitions" ON public.onboarding_tasks_definition;
CREATE POLICY "Admins can manage onboarding task definitions" 
ON public.onboarding_tasks_definition 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());