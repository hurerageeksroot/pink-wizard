-- Fix RLS policies for contacts table
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts" 
ON contacts FOR SELECT 
USING (auth.uid() = user_id);

-- Fix RLS policies for activities table  
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities" 
ON activities FOR SELECT 
USING (auth.uid() = user_id);

-- Also ensure service role can access data for edge functions
DROP POLICY IF EXISTS "Service role can manage contacts" ON contacts;
CREATE POLICY "Service role can manage contacts" 
ON contacts FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage activities" ON activities;
CREATE POLICY "Service role can manage activities" 
ON activities FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');