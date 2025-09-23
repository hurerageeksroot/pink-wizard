-- Fix foreign key relationships for community tables
-- Add proper foreign key constraints for community_posts
ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add proper foreign key constraints for community_comments  
ALTER TABLE public.community_comments
ADD CONSTRAINT community_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.community_comments
ADD CONSTRAINT community_comments_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

-- Add proper foreign key constraints for community_reactions
ALTER TABLE public.community_reactions
ADD CONSTRAINT community_reactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.community_reactions
ADD CONSTRAINT community_reactions_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON public.community_reactions(post_id);

-- Add some sample seed data for testing
INSERT INTO public.community_posts (user_id, content, post_type, is_published, metadata) 
SELECT 
  id, 
  'Welcome to the community! Excited to share my journey and connect with everyone here. 🚀',
  'general',
  true,
  '{"tags": ["welcome", "introduction"]}'::jsonb
FROM public.profiles 
WHERE display_name IS NOT NULL
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO public.community_posts (user_id, content, post_type, is_published, metadata)
SELECT 
  id,
  'Just hit my first milestone! 🎉 Feeling grateful for this amazing community support.',
  'achievement', 
  true,
  '{"milestone": "first_win", "celebration": true}'::jsonb
FROM public.profiles
WHERE display_name IS NOT NULL
LIMIT 2  
ON CONFLICT DO NOTHING;