-- Create campaign_initiatives table
CREATE TABLE IF NOT EXISTS campaign_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
  name TEXT NOT NULL,
  description TEXT,
  campaign_goal TEXT NOT NULL,
  
  -- Event/campaign details
  event_date DATE,
  event_location TEXT,
  deadline_date DATE,
  
  -- Target audience
  target_segments JSONB DEFAULT '[]'::jsonb,
  target_relationship_types JSONB DEFAULT '[]'::jsonb,
  
  -- Value proposition context
  value_proposition TEXT,
  key_benefits JSONB DEFAULT '[]'::jsonb,
  call_to_action TEXT,
  
  -- Additional context for AI
  tone TEXT DEFAULT 'professional',
  urgency_level TEXT DEFAULT 'medium',
  proof_points JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on campaign_initiatives
ALTER TABLE campaign_initiatives ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_initiatives
CREATE POLICY "Users can view their own campaigns"
  ON campaign_initiatives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON campaign_initiatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON campaign_initiatives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON campaign_initiatives FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for campaign_initiatives
CREATE INDEX IF NOT EXISTS idx_campaign_initiatives_user_id ON campaign_initiatives(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_initiatives_active ON campaign_initiatives(user_id, is_active) WHERE is_active = true;

-- Create campaign_outreach_log table
CREATE TABLE IF NOT EXISTS campaign_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaign_initiatives(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Simple tracking
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  activity_id UUID REFERENCES activities(id),
  
  -- Optional metadata
  channel TEXT,
  ai_tokens_used INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on campaign_outreach_log
ALTER TABLE campaign_outreach_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_outreach_log
CREATE POLICY "Users can view their own campaign outreach logs"
  ON campaign_outreach_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaign outreach logs"
  ON campaign_outreach_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaign outreach logs"
  ON campaign_outreach_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaign outreach logs"
  ON campaign_outreach_log FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for campaign_outreach_log
CREATE INDEX IF NOT EXISTS idx_campaign_outreach_log_campaign ON campaign_outreach_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_outreach_log_contact ON campaign_outreach_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_outreach_log_user ON campaign_outreach_log(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_outreach_log_generated_at ON campaign_outreach_log(generated_at DESC);