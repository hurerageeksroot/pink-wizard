-- Fix security vulnerabilities by restricting access to sensitive business data

-- 1. Fix email_templates - should only be accessible to authenticated users, not public
DROP POLICY IF EXISTS "Anyone can view active email templates" ON public.email_templates;
CREATE POLICY "Authenticated users can view active email templates" 
ON public.email_templates 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

-- 2. Fix reward system tables - should only be accessible to authenticated users
DROP POLICY IF EXISTS "Anyone can view active badges" ON public.badges_definition;
CREATE POLICY "Authenticated users can view active badges" 
ON public.badges_definition 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

DROP POLICY IF EXISTS "Anyone can view reward packs" ON public.reward_packs;
CREATE POLICY "Authenticated users can view reward packs" 
ON public.reward_packs 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

DROP POLICY IF EXISTS "Anyone can view reward items" ON public.reward_items;
CREATE POLICY "Authenticated users can view reward items" 
ON public.reward_items 
FOR SELECT 
USING ((EXISTS ( SELECT 1 FROM reward_packs WHERE ((reward_packs.id = reward_items.reward_pack_id) AND (reward_packs.is_active = true)))) AND (auth.uid() IS NOT NULL));

DROP POLICY IF EXISTS "Anyone can view reward config" ON public.variable_rewards_config;
CREATE POLICY "Authenticated users can view reward config" 
ON public.variable_rewards_config 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

-- 3. Fix activity_weights - should only be accessible to authenticated users  
DROP POLICY IF EXISTS "Anyone can view active activity weights" ON public.activity_weights;
CREATE POLICY "Authenticated users can view active activity weights" 
ON public.activity_weights 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

-- 4. Content pages policy is actually fine - published content should be public for website functionality
-- No changes needed for content_pages as it's intentionally public for website content