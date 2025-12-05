-- Fix security linter warnings

-- Ensure RLS is enabled on all new tables (redundant but ensures it's set)
ALTER TABLE public.user_icp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_searches ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the trigger function with proper search_path
DROP TRIGGER IF EXISTS update_user_icp_updated_at ON public.user_icp;
DROP FUNCTION IF EXISTS public.update_user_icp_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_icp_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_icp_updated_at
  BEFORE UPDATE ON public.user_icp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_icp_updated_at();