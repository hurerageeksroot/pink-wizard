-- First, let's check if we need to add revenue tracking to contacts table
-- and create views for leaderboard rankings

-- Add revenue field to contacts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'revenue_amount') THEN
        ALTER TABLE public.contacts ADD COLUMN revenue_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create views for different leaderboard types
CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(upl.points_earned), 0) as total_points,
    COUNT(upl.id) as total_activities,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(upl.points_earned), 0) DESC) as rank_position
FROM public.profiles p
LEFT JOIN public.user_points_ledger upl ON p.id = upl.user_id
WHERE p.show_in_leaderboard = true
GROUP BY p.id, p.display_name, p.avatar_url
ORDER BY total_points DESC;

CREATE OR REPLACE VIEW public.revenue_leaderboard AS
SELECT 
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(c.revenue_amount), 0) as total_revenue,
    COUNT(c.id) FILTER (WHERE c.status = 'won') as won_deals,
    COUNT(c.id) as total_contacts,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) as rank_position
FROM public.profiles p
LEFT JOIN public.contacts c ON p.id = c.user_id AND c.status = 'won'
WHERE p.show_in_leaderboard = true
GROUP BY p.id, p.display_name, p.avatar_url
ORDER BY total_revenue DESC;

-- Create user_points_ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_points_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    challenge_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_points_ledger
ALTER TABLE public.user_points_ledger ENABLE ROW LEVEL SECURITY;

-- Create policies for user_points_ledger if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_points_ledger' 
        AND policyname = 'Users can view their own points'
    ) THEN
        CREATE POLICY "Users can view their own points" 
        ON public.user_points_ledger 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_points_ledger' 
        AND policyname = 'Service role can manage all points'
    ) THEN
        CREATE POLICY "Service role can manage all points" 
        ON public.user_points_ledger 
        FOR ALL 
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_ledger_user_id ON public.user_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_ledger_activity_type ON public.user_points_ledger(activity_type);
CREATE INDEX IF NOT EXISTS idx_contacts_revenue ON public.contacts(user_id, status, revenue_amount) WHERE status = 'won';