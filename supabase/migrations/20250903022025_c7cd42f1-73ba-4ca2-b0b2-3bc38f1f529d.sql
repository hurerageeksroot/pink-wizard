-- Create user points ledger table for tracking all point transactions
CREATE TABLE public.user_points_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  challenge_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on points ledger
ALTER TABLE public.user_points_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for points ledger
CREATE POLICY "Users can view their own points" 
ON public.user_points_ledger 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage points" 
ON public.user_points_ledger 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Create indexes for better performance
CREATE INDEX idx_user_points_ledger_user_id ON public.user_points_ledger(user_id);
CREATE INDEX idx_user_points_ledger_activity_type ON public.user_points_ledger(activity_type);
CREATE INDEX idx_user_points_ledger_created_at ON public.user_points_ledger(created_at);

-- Function to award points consistently
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_challenge_day INTEGER DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_to_award INTEGER;
  weight_multiplier NUMERIC;
BEGIN
  -- Get weight for this activity type
  SELECT weight INTO weight_multiplier
  FROM public.activity_weights 
  WHERE activity_type = p_activity_type AND is_active = true
  LIMIT 1;
  
  -- Default to 10 points if no weight found
  weight_multiplier := COALESCE(weight_multiplier, 10.0);
  points_to_award := weight_multiplier::INTEGER;
  
  -- Insert into points ledger
  INSERT INTO public.user_points_ledger (
    user_id, 
    activity_type, 
    points_earned,
    description, 
    metadata, 
    challenge_day
  ) VALUES (
    p_user_id, 
    p_activity_type, 
    points_to_award,
    p_description, 
    p_metadata, 
    p_challenge_day
  );
  
  RETURN points_to_award;
END;
$$;

-- Insert default activity weights for all activity types
INSERT INTO public.activity_weights (activity_type, weight, description) VALUES
('contact_added', 10, 'Points for adding a new contact'),
('contact_won', 50, 'Points for winning a contact/deal'),
('contact_response', 25, 'Points for receiving a response from a contact'),
('networking_event', 30, 'Points for attending a networking event'),
('community_post', 15, 'Points for creating a community post'),
('community_comment', 10, 'Points for commenting on a post'),
('community_reaction', 5, 'Points for reacting to a post'),
('revenue_logged', 100, 'Points for logging revenue (per $1000)'),
('outreach_activity', 20, 'Points for general outreach activities'),
('daily_task_completed', 15, 'Points for completing daily tasks'),
('onboarding_task_completed', 20, 'Points for completing onboarding tasks')
ON CONFLICT (activity_type) DO UPDATE SET
  weight = EXCLUDED.weight,
  description = EXCLUDED.description,
  updated_at = now();

-- Create triggers for automatic point awarding

-- Trigger for contact added
CREATE OR REPLACE FUNCTION public.award_contact_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_points(
    NEW.user_id,
    'contact_added',
    'Added contact: ' || NEW.name,
    jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_points_trigger
  AFTER INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.award_contact_points();

-- Trigger for contact status change to won
CREATE OR REPLACE FUNCTION public.award_contact_won_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Award points when status changes to 'won'
  IF OLD.status != 'won' AND NEW.status = 'won' THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_won',
      'Won contact: ' || NEW.name,
      jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
    );
  END IF;
  
  -- Award points for response received
  IF OLD.response_received = false AND NEW.response_received = true THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_response',
      'Received response from: ' || NEW.name,
      jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_status_points_trigger
  AFTER UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.award_contact_won_points();

-- Update networking events trigger to use new points system
DROP TRIGGER IF EXISTS calculate_networking_points ON public.networking_events;

CREATE OR REPLACE FUNCTION public.award_networking_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_points(
    NEW.user_id,
    'networking_event',
    'Attended: ' || NEW.event_name,
    jsonb_build_object(
      'event_id', NEW.id, 
      'event_name', NEW.event_name,
      'contacts_met', NEW.contacts_met_count
    ),
    NEW.challenge_day
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER networking_points_trigger
  AFTER INSERT ON public.networking_events
  FOR EACH ROW EXECUTE FUNCTION public.award_networking_points();

-- Community points triggers
CREATE OR REPLACE FUNCTION public.award_community_post_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_points(
    NEW.user_id,
    'community_post',
    'Created community post',
    jsonb_build_object('post_id', NEW.id, 'post_type', NEW.post_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_post_points_trigger
  AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.award_community_post_points();

CREATE OR REPLACE FUNCTION public.award_community_comment_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_points(
    NEW.user_id,
    'community_comment',
    'Added comment on post',
    jsonb_build_object('comment_id', NEW.id, 'post_id', NEW.post_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_comment_points_trigger
  AFTER INSERT ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.award_community_comment_points();

CREATE OR REPLACE FUNCTION public.award_community_reaction_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.award_points(
    NEW.user_id,
    'community_reaction',
    'Reacted to post: ' || NEW.reaction_type,
    jsonb_build_object('post_id', NEW.post_id, 'reaction_type', NEW.reaction_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_reaction_points_trigger
  AFTER INSERT ON public.community_reactions
  FOR EACH ROW EXECUTE FUNCTION public.award_community_reaction_points();

-- Create view for user points summary
CREATE OR REPLACE VIEW public.user_points_summary AS
SELECT 
  user_id,
  SUM(points_earned) as total_points,
  COUNT(*) as total_activities,
  MAX(created_at) as last_activity
FROM public.user_points_ledger
GROUP BY user_id;

-- Create view for recent points activity
CREATE OR REPLACE VIEW public.recent_points_activity AS
SELECT 
  upl.*,
  p.display_name
FROM public.user_points_ledger upl
LEFT JOIN public.profiles p ON p.id = upl.user_id
ORDER BY upl.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON public.user_points_summary TO authenticated;
GRANT SELECT ON public.recent_points_activity TO authenticated;