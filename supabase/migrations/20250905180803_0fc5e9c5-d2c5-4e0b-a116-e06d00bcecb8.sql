-- Fix networking events access for all authenticated users
-- Remove restrictive write access requirements

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own networking events" ON public.networking_events;
DROP POLICY IF EXISTS "Users can update their own networking events" ON public.networking_events;
DROP POLICY IF EXISTS "Users can delete their own networking events" ON public.networking_events;

-- Create simple policies that only require authentication
CREATE POLICY "Users can insert their own networking events" 
ON public.networking_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking events" 
ON public.networking_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking events" 
ON public.networking_events 
FOR DELETE 
USING (auth.uid() = user_id);