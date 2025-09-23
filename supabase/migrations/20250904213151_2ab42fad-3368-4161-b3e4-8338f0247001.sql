-- Add admin policies for challenge_config table management
-- Currently only has SELECT policy, missing admin management policies

CREATE POLICY "Admins can manage challenge config" 
ON public.challenge_config 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());