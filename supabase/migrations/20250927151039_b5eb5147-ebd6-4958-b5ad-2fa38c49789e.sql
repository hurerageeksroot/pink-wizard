-- Create contact_contexts table for multi-tag system
CREATE TABLE IF NOT EXISTS public.contact_contexts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Tag',
  color_class text NOT NULL DEFAULT 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on contact_contexts
ALTER TABLE public.contact_contexts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_contexts
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own contact contexts" ON public.contact_contexts;
  DROP POLICY IF EXISTS "Users can insert their own contact contexts" ON public.contact_contexts;
  DROP POLICY IF EXISTS "Users can update their own contact contexts" ON public.contact_contexts;
  DROP POLICY IF EXISTS "Users can delete their own contact contexts" ON public.contact_contexts;
  
  -- Create new policies
END $$;

CREATE POLICY "Users can view their own contact contexts" 
ON public.contact_contexts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact contexts" 
ON public.contact_contexts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact contexts" 
ON public.contact_contexts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact contexts" 
ON public.contact_contexts 
FOR DELETE 
USING (auth.uid() = user_id);