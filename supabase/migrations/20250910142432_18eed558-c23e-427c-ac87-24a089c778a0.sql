-- Add missing RLS policies for user_metrics table

-- Allow users to insert their own metrics
CREATE POLICY "Users can insert their own metrics" 
ON public.user_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own metrics
CREATE POLICY "Users can view their own metrics" 
ON public.user_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own metrics (optional for future use)
CREATE POLICY "Users can update their own metrics" 
ON public.user_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);