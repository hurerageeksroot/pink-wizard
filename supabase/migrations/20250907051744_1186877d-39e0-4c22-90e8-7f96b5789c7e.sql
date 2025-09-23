-- Remove restrictive check constraint on contacts.category to allow dynamic categories
ALTER TABLE public.contacts DROP CONSTRAINT contacts_category_check;