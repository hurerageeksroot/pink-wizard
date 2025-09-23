-- Fix user_roles RLS policies (skip existing ones)
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- Create granular RLS policies for user_roles
CREATE POLICY "Admins can select all user roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (is_admin());

-- Restrict email sequences and steps to admin only (drop existing non-admin policies)
DROP POLICY IF EXISTS "Anyone can view active email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Anyone can view active email sequence steps" ON public.email_sequence_steps;