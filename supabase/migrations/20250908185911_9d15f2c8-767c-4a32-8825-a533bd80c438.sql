-- Security fixes implementation

-- 1. Fix user_roles RLS policies to prevent privilege escalation
-- First check current policies on user_roles table
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Also check if user_roles table even exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_roles';

-- Check email_sequences policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'email_sequences';