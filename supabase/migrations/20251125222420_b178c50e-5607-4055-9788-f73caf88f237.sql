-- Create user_icp table to store Ideal Customer Profile
CREATE TABLE IF NOT EXISTS public.user_icp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_industries TEXT[] DEFAULT '{}',
  target_job_titles TEXT[] DEFAULT '{}',
  target_company_sizes TEXT[] DEFAULT '{}',
  geographic_scope TEXT DEFAULT 'local' CHECK (geographic_scope IN ('local', 'regional', 'national', 'international')),
  target_locations TEXT[] DEFAULT '{}',
  key_characteristics TEXT,
  generated_from_contacts UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create prospect_suggestions table to store AI-generated leads
CREATE TABLE IF NOT EXISTS public.prospect_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  position TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  location TEXT,
  source_url TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'saved', 'added_to_contacts', 'dismissed')),
  search_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create prospect_searches table to track daily usage
CREATE TABLE IF NOT EXISTS public.prospect_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_date DATE DEFAULT CURRENT_DATE,
  prospects_found INTEGER DEFAULT 0,
  search_params JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, search_date)
);

-- Enable RLS
ALTER TABLE public.user_icp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_icp
CREATE POLICY "Users can view their own ICP"
  ON public.user_icp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ICP"
  ON public.user_icp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ICP"
  ON public.user_icp FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ICP"
  ON public.user_icp FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage ICP"
  ON public.user_icp FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for prospect_suggestions
CREATE POLICY "Users can view their own prospects"
  ON public.prospect_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prospects"
  ON public.prospect_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospects"
  ON public.prospect_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prospects"
  ON public.prospect_suggestions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage prospects"
  ON public.prospect_suggestions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for prospect_searches
CREATE POLICY "Users can view their own searches"
  ON public.prospect_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
  ON public.prospect_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage searches"
  ON public.prospect_searches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_icp_user_id ON public.user_icp(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_suggestions_user_id ON public.prospect_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_suggestions_status ON public.prospect_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_prospect_suggestions_search_date ON public.prospect_suggestions(search_date);
CREATE INDEX IF NOT EXISTS idx_prospect_searches_user_date ON public.prospect_searches(user_id, search_date);

-- Create trigger for updated_at on user_icp
CREATE OR REPLACE FUNCTION public.update_user_icp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_icp_updated_at
  BEFORE UPDATE ON public.user_icp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_icp_updated_at();