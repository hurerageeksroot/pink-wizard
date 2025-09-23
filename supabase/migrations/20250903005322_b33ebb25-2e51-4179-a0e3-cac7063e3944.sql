-- Create activity_weights table for configurable scoring
CREATE TABLE public.activity_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL UNIQUE,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_weights
ALTER TABLE public.activity_weights ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_weights
CREATE POLICY "Anyone can view active activity weights" 
ON public.activity_weights 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage activity weights" 
ON public.activity_weights 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create networking_events table
CREATE TABLE public.networking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'general',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  contacts_met_count INTEGER NOT NULL DEFAULT 0,
  follow_ups_scheduled INTEGER NOT NULL DEFAULT 0,
  challenge_day INTEGER NOT NULL,
  outreach_points NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on networking_events
ALTER TABLE public.networking_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for networking_events
CREATE POLICY "Users can view their own networking events" 
ON public.networking_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own networking events" 
ON public.networking_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can update their own networking events" 
ON public.networking_events 
FOR UPDATE 
USING (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can delete their own networking events" 
ON public.networking_events 
FOR DELETE 
USING (auth.uid() = user_id AND user_can_write());

-- Create networking_event_contacts table
CREATE TABLE public.networking_event_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  networking_event_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  follow_up_scheduled BOOLEAN NOT NULL DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(networking_event_id, contact_id)
);

-- Enable RLS on networking_event_contacts
ALTER TABLE public.networking_event_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for networking_event_contacts
CREATE POLICY "Users can view their own networking event contacts" 
ON public.networking_event_contacts 
FOR SELECT 
USING (EXISTS(
  SELECT 1 FROM public.networking_events ne 
  WHERE ne.id = networking_event_contacts.networking_event_id 
  AND ne.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own networking event contacts" 
ON public.networking_event_contacts 
FOR INSERT 
WITH CHECK (EXISTS(
  SELECT 1 FROM public.networking_events ne 
  WHERE ne.id = networking_event_contacts.networking_event_id 
  AND ne.user_id = auth.uid()
) AND user_can_write());

CREATE POLICY "Users can update their own networking event contacts" 
ON public.networking_event_contacts 
FOR UPDATE 
USING (EXISTS(
  SELECT 1 FROM public.networking_events ne 
  WHERE ne.id = networking_event_contacts.networking_event_id 
  AND ne.user_id = auth.uid()
) AND user_can_write());

CREATE POLICY "Users can delete their own networking event contacts" 
ON public.networking_event_contacts 
FOR DELETE 
USING (EXISTS(
  SELECT 1 FROM public.networking_events ne 
  WHERE ne.id = networking_event_contacts.networking_event_id 
  AND ne.user_id = auth.uid()
) AND user_can_write());

-- Function to get current challenge day (if not exists)
CREATE OR REPLACE FUNCTION public.get_current_challenge_day()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_day INTEGER;
  start_date DATE;
  current_date DATE;
BEGIN
  -- Get current date
  SELECT CURRENT_DATE INTO current_date;
  
  -- Get challenge start date and current day
  SELECT cc.start_date, cc.current_day INTO start_date, challenge_day
  FROM public.challenge_config cc 
  WHERE cc.is_active = true 
  LIMIT 1;
  
  -- If we have a start date, calculate the actual day based on date difference
  IF start_date IS NOT NULL THEN
    challenge_day := (current_date - start_date) + 1;
    -- Ensure we don't go below 1 or above 75
    challenge_day := GREATEST(1, LEAST(75, challenge_day));
  END IF;
  
  RETURN COALESCE(challenge_day, 1);
END;
$$;

-- Function to log outreach points
CREATE OR REPLACE FUNCTION public.log_outreach_points(
  p_user_id UUID,
  p_activity_type TEXT,
  p_challenge_day INTEGER,
  p_base_count NUMERIC DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weight_multiplier NUMERIC;
  total_points NUMERIC;
BEGIN
  -- Get weight for this activity type
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  -- Default to 1.0 if no weight found
  weight_multiplier := COALESCE(weight_multiplier, 1.0);
  
  -- Calculate total points
  total_points := p_base_count * weight_multiplier;
  
  -- Insert into user_metrics as outreach_points
  INSERT INTO public.user_metrics (
    user_id, 
    metric_name, 
    metric_type,
    value, 
    unit, 
    challenge_day, 
    notes
  ) VALUES (
    p_user_id, 
    'outreach_points',
    p_activity_type,
    total_points, 
    'points', 
    p_challenge_day, 
    p_notes
  );
  
  RETURN total_points;
END;
$$;

-- Trigger function to auto-calculate networking event points
CREATE OR REPLACE FUNCTION public.calculate_networking_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_earned NUMERIC;
BEGIN
  -- Calculate points for the networking event
  points_earned := public.log_outreach_points(
    NEW.user_id,
    'networking_event',
    NEW.challenge_day,
    1.0, -- Base count of 1 per event
    'Networking event: ' || NEW.event_name
  );
  
  -- Update the networking event with calculated points
  NEW.outreach_points := points_earned;
  
  RETURN NEW;
END;
$$;

-- Create trigger for networking events
CREATE TRIGGER calculate_networking_event_points
  BEFORE INSERT ON public.networking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_networking_points();

-- Update timestamps trigger for activity_weights
CREATE TRIGGER update_activity_weights_updated_at
  BEFORE UPDATE ON public.activity_weights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps trigger for networking_events
CREATE TRIGGER update_networking_events_updated_at
  BEFORE UPDATE ON public.networking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default activity weights
INSERT INTO public.activity_weights (activity_type, weight, description) VALUES
('networking_event', 5.0, 'In-person networking events - high value for relationship building'),
('cold', 1.0, 'Cold outreach attempts'),
('warm', 1.5, 'Warm outreach to existing connections'), 
('social', 1.0, 'Social media interactions'),
('follow_up', 1.2, 'Follow-up communications'),
('referral', 3.0, 'Referral activities - high conversion potential')
ON CONFLICT (activity_type) DO NOTHING;

-- Extend check_and_award_badges function to include networking milestones
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(awarded_badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    badge_rec RECORD;
    user_stats RECORD;
    awarded_badges UUID[] := '{}';
BEGIN
    -- Get user stats for comparison including networking stats
    SELECT 
        COUNT(*) FILTER (WHERE c.status = 'won') as contacts_won,
        COUNT(*) as total_contacts,
        COALESCE(SUM(CAST(um.value AS NUMERIC)) FILTER (WHERE um.metric_name = 'event_value'), 0) as total_revenue,
        COALESCE(MAX(ucp.current_streak), 0) as current_streak,
        COALESCE(COUNT(ne.id), 0) as networking_events_count,
        COALESCE(SUM(CAST(um_points.value AS NUMERIC)) FILTER (WHERE um_points.metric_name = 'outreach_points'), 0) as total_outreach_points
    INTO user_stats
    FROM public.contacts c
    LEFT JOIN public.user_metrics um ON um.user_id = p_user_id
    LEFT JOIN public.user_challenge_progress ucp ON ucp.user_id = p_user_id
    LEFT JOIN public.networking_events ne ON ne.user_id = p_user_id
    LEFT JOIN public.user_metrics um_points ON um_points.user_id = p_user_id
    WHERE c.user_id = p_user_id;
    
    -- Check each active badge definition
    FOR badge_rec IN 
        SELECT bd.* FROM public.badges_definition bd 
        WHERE bd.is_active = true 
        AND NOT EXISTS(SELECT 1 FROM public.user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_id = bd.id)
    LOOP
        -- Check if user meets criteria for this badge
        CASE 
            WHEN badge_rec.criteria->>'type' = 'contacts_added' AND 
                 user_stats.total_contacts >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                -- Award the badge
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'contacts_won' AND 
                 user_stats.contacts_won >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'total_revenue' AND 
                 user_stats.total_revenue >= (badge_rec.criteria->>'threshold')::NUMERIC THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'daily_streak' AND 
                 user_stats.current_streak >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'networking_events' AND 
                 user_stats.networking_events_count >= (badge_rec.criteria->>'threshold')::INTEGER THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
                
            WHEN badge_rec.criteria->>'type' = 'outreach_points' AND 
                 user_stats.total_outreach_points >= (badge_rec.criteria->>'threshold')::NUMERIC THEN
                INSERT INTO public.user_badges (user_id, badge_id) 
                VALUES (p_user_id, badge_rec.id)
                ON CONFLICT (user_id, badge_id) DO NOTHING;
                awarded_badges := array_append(awarded_badges, badge_rec.id);
        END CASE;
    END LOOP;
    
    -- Return awarded badges
    RETURN QUERY
    SELECT bd.id, bd.name
    FROM public.badges_definition bd
    WHERE bd.id = ANY(awarded_badges);
END;
$$;

-- Add variable reward config for networking events
INSERT INTO public.variable_rewards_config (event_type, base_probability, streak_multiplier, performance_multiplier)
VALUES ('networking_event_logged', 0.15, 1.8, 2.5)
ON CONFLICT (event_type) DO NOTHING;