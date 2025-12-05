-- Fix security issue: Set search_path explicitly on the function
ALTER FUNCTION ensure_past_client_type() SET search_path = public;