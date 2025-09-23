-- Add admin policy for deleting community posts
CREATE POLICY "Admins can delete any posts" ON public.community_posts
  FOR DELETE  
  USING (is_admin());

-- Add admin policy for updating community posts
CREATE POLICY "Admins can update any posts" ON public.community_posts
  FOR UPDATE
  USING (is_admin());