-- Create business_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT,
  value_proposition TEXT,
  industry TEXT,
  target_market TEXT,
  key_differentiators TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (this is the critical fix)
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to restrict access to user-owned profiles only

-- Users can only view their own business profile
CREATE POLICY "Users can view their own business profile" 
ON public.business_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own business profile  
CREATE POLICY "Users can insert their own business profile"
ON public.business_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own business profile
CREATE POLICY "Users can update their own business profile"
ON public.business_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own business profile
CREATE POLICY "Users can delete their own business profile"
ON public.business_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can manage all business profiles (for admin functions)
CREATE POLICY "Service role can manage all business profiles"
ON public.business_profiles 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_profiles_updated_at();