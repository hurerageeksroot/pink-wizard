-- Add page_type column to content_pages table
ALTER TABLE public.content_pages 
ADD COLUMN page_type TEXT DEFAULT 'page' CHECK (page_type IN ('article', 'help', 'page'));

-- Update existing rows to have a default page_type
UPDATE public.content_pages 
SET page_type = 'page' 
WHERE page_type IS NULL;