-- Create community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'achievement', 'milestone', 'question'
  metadata JSONB DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community comments table  
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community reactions table
CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID,
  comment_id UUID,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like', 'celebrate', 'support', 'insightful'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create community follows table
CREATE TABLE public.community_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create community reports table for moderation
CREATE TABLE public.community_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  post_id UUID,
  comment_id UUID,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_report_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Users can view published posts" 
ON public.community_posts 
FOR SELECT 
USING (is_published = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts 
FOR DELETE 
USING (auth.uid() = user_id AND user_can_write());

-- RLS Policies for community_comments
CREATE POLICY "Users can view comments on published posts" 
ON public.community_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.community_posts 
  WHERE id = community_comments.post_id AND is_published = true
));

CREATE POLICY "Users can create comments" 
ON public.community_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can update their own comments" 
ON public.community_comments 
FOR UPDATE 
USING (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can delete their own comments" 
ON public.community_comments 
FOR DELETE 
USING (auth.uid() = user_id AND user_can_write());

-- RLS Policies for community_reactions
CREATE POLICY "Users can view reactions" 
ON public.community_reactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own reactions" 
ON public.community_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can delete their own reactions" 
ON public.community_reactions 
FOR DELETE 
USING (auth.uid() = user_id AND user_can_write());

-- RLS Policies for community_follows
CREATE POLICY "Users can view follows" 
ON public.community_follows 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own follows" 
ON public.community_follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id AND user_can_write());

CREATE POLICY "Users can delete their own follows" 
ON public.community_follows 
FOR DELETE 
USING (auth.uid() = follower_id AND user_can_write());

-- RLS Policies for community_reports
CREATE POLICY "Users can create reports" 
ON public.community_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
ON public.community_reports 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update reports" 
ON public.community_reports 
FOR UPDATE 
USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_community_posts_user_created ON public.community_posts(user_id, created_at DESC);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC) WHERE is_published = true;
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id, created_at);
CREATE INDEX idx_community_reactions_post ON public.community_reactions(post_id);
CREATE INDEX idx_community_reactions_comment ON public.community_reactions(comment_id);
CREATE INDEX idx_community_reactions_user ON public.community_reactions(user_id);
CREATE INDEX idx_community_follows_follower ON public.community_follows(follower_id);
CREATE INDEX idx_community_follows_following ON public.community_follows(following_id);

-- Add unique constraint to prevent duplicate reactions
CREATE UNIQUE INDEX idx_community_reactions_unique_post 
ON public.community_reactions(post_id, user_id, reaction_type) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX idx_community_reactions_unique_comment 
ON public.community_reactions(comment_id, user_id, reaction_type) 
WHERE comment_id IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();