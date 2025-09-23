-- Remove the remaining public access policy for reward_packs
DROP POLICY IF EXISTS "Anyone can view active reward packs" ON public.reward_packs;