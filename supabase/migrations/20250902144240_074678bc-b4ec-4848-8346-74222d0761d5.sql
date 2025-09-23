-- Create storage bucket for badge images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badge-images', 'badge-images', true);

-- Create RLS policies for badge images
CREATE POLICY "Anyone can view badge images" 
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

-- Add image_url column to badges_definition table
ALTER TABLE public.badges_definition 
ADD COLUMN image_url TEXT;

-- Create index for better performance
CREATE INDEX idx_badges_definition_image_url ON public.badges_definition(image_url);

-- Add comment to explain the field
COMMENT ON COLUMN public.badges_definition.image_url IS 'Optional custom badge image URL from storage';