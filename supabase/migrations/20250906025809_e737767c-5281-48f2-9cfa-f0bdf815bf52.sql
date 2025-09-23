-- Create storage policies for badge images
CREATE POLICY "Badge images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'badge-images');

CREATE POLICY "Admins can upload badge images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'badge-images' AND is_admin());

CREATE POLICY "Admins can update badge images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'badge-images' AND is_admin());

CREATE POLICY "Admins can delete badge images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'badge-images' AND is_admin());