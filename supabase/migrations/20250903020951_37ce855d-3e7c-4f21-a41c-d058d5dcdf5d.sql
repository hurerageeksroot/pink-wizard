-- Fix the unique constraint for community reactions to allow proper reaction management
-- First, drop any existing problematic constraints
DROP INDEX IF EXISTS idx_community_reactions_unique_post;

-- Create proper unique constraint for user reactions (one reaction type per user per post)
CREATE UNIQUE INDEX idx_community_reactions_user_post_type 
ON public.community_reactions(user_id, post_id, reaction_type);

-- Also create a simpler index for better performance
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_user 
ON public.community_reactions(post_id, user_id);