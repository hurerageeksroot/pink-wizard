-- Add address fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN address text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text,
ADD COLUMN country text;