-- Drop the unused payment_security_metrics view to resolve security linter warning
-- This view was flagged as having SECURITY DEFINER which can bypass RLS policies
DROP VIEW IF EXISTS public.payment_security_metrics;