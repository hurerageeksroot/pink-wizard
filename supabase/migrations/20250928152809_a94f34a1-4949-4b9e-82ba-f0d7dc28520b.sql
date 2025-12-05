-- Create relationship intent configurations table
CREATE TABLE public.relationship_intent_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'User',
  color_class TEXT NOT NULL DEFAULT 'text-gray-600',
  default_status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create relationship status options table
CREATE TABLE public.relationship_status_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent TEXT NOT NULL REFERENCES public.relationship_intent_configs(intent) ON DELETE CASCADE,
  status_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800 border-gray-200',
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(intent, status_key)
);

-- Enable RLS
ALTER TABLE public.relationship_intent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_status_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage intent configs" ON public.relationship_intent_configs
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view intent configs" ON public.relationship_intent_configs
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage status options" ON public.relationship_status_options
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view status options" ON public.relationship_status_options
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_relationship_intent_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relationship_intent_configs_updated_at
  BEFORE UPDATE ON public.relationship_intent_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_relationship_intent_configs_updated_at();

CREATE OR REPLACE FUNCTION public.update_relationship_status_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relationship_status_options_updated_at
  BEFORE UPDATE ON public.relationship_status_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_relationship_status_options_updated_at();

-- Insert default data (migrating from hardcoded configs)
INSERT INTO public.relationship_intent_configs (intent, label, description, icon_name, color_class, default_status) VALUES
('business_lead', 'Business Lead', 'Potential business opportunities and prospects', 'Briefcase', 'text-blue-600', 'new'),
('personal_connection', 'Personal Connection', 'Personal relationships and social connections', 'Heart', 'text-pink-600', 'friend'),
('referral_source', 'Referral Source', 'People who can provide referrals and recommendations', 'ArrowRight', 'text-green-600', 'active'),
('past_client', 'Past Client', 'Previous clients and completed business relationships', 'CheckCircle', 'text-purple-600', 'completed'),
('industry_contact', 'Industry Contact', 'Professional contacts within your industry', 'Building', 'text-indigo-600', 'connected'),
('service_provider', 'Service Provider', 'Vendors, suppliers, and service providers', 'Tool', 'text-orange-600', 'active');

-- Insert default status options for each intent
-- Business Lead statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('business_lead', 'new', 'New', 'Initial contact, not yet engaged', 'bg-gray-100 text-gray-800 border-gray-200', false, 1),
('business_lead', 'contacted', 'Contacted', 'Initial outreach completed', 'bg-blue-100 text-blue-800 border-blue-200', false, 2),
('business_lead', 'interested', 'Interested', 'Showing interest in your services', 'bg-yellow-100 text-yellow-800 border-yellow-200', false, 3),
('business_lead', 'qualified', 'Qualified', 'Qualified as a good prospect', 'bg-green-100 text-green-800 border-green-200', false, 4),
('business_lead', 'proposal_sent', 'Proposal Sent', 'Proposal or quote has been sent', 'bg-purple-100 text-purple-800 border-purple-200', false, 5),
('business_lead', 'won', 'Won', 'Deal closed successfully', 'bg-emerald-100 text-emerald-800 border-emerald-200', true, 6),
('business_lead', 'lost', 'Lost', 'Deal lost or declined', 'bg-red-100 text-red-800 border-red-200', true, 7);

-- Personal Connection statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('personal_connection', 'new', 'New', 'Recently met, getting to know', 'bg-gray-100 text-gray-800 border-gray-200', false, 1),
('personal_connection', 'friend', 'Friend', 'Established friendship', 'bg-pink-100 text-pink-800 border-pink-200', false, 2),
('personal_connection', 'close_friend', 'Close Friend', 'Close personal relationship', 'bg-rose-100 text-rose-800 border-rose-200', false, 3),
('personal_connection', 'acquaintance', 'Acquaintance', 'Casual acquaintance', 'bg-gray-100 text-gray-800 border-gray-200', false, 4),
('personal_connection', 'inactive', 'Inactive', 'Lost touch', 'bg-slate-100 text-slate-800 border-slate-200', true, 5);

-- Referral Source statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('referral_source', 'new', 'New', 'Recently identified as potential referral source', 'bg-gray-100 text-gray-800 border-gray-200', false, 1),
('referral_source', 'active', 'Active', 'Actively providing referrals', 'bg-green-100 text-green-800 border-green-200', false, 2),
('referral_source', 'occasional', 'Occasional', 'Provides referrals occasionally', 'bg-yellow-100 text-yellow-800 border-yellow-200', false, 3),
('referral_source', 'inactive', 'Inactive', 'No longer providing referrals', 'bg-red-100 text-red-800 border-red-200', true, 4);

-- Past Client statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('past_client', 'completed', 'Completed', 'Project successfully completed', 'bg-green-100 text-green-800 border-green-200', true, 1),
('past_client', 'repeat_potential', 'Repeat Potential', 'Potential for future work', 'bg-blue-100 text-blue-800 border-blue-200', false, 2),
('past_client', 'referral_source', 'Referral Source', 'Now provides referrals', 'bg-purple-100 text-purple-800 border-purple-200', false, 3),
('past_client', 'no_contact', 'No Contact', 'No ongoing relationship', 'bg-gray-100 text-gray-800 border-gray-200', true, 4);

-- Industry Contact statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('industry_contact', 'new', 'New', 'Recently connected', 'bg-gray-100 text-gray-800 border-gray-200', false, 1),
('industry_contact', 'connected', 'Connected', 'Active professional relationship', 'bg-indigo-100 text-indigo-800 border-indigo-200', false, 2),
('industry_contact', 'collaborative', 'Collaborative', 'Working together on projects', 'bg-blue-100 text-blue-800 border-blue-200', false, 3),
('industry_contact', 'mentor', 'Mentor', 'Mentoring relationship', 'bg-green-100 text-green-800 border-green-200', false, 4),
('industry_contact', 'inactive', 'Inactive', 'Limited interaction', 'bg-gray-100 text-gray-800 border-gray-200', true, 5);

-- Service Provider statuses
INSERT INTO public.relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order) VALUES
('service_provider', 'new', 'New', 'Recently identified', 'bg-gray-100 text-gray-800 border-gray-200', false, 1),
('service_provider', 'active', 'Active', 'Currently using their services', 'bg-orange-100 text-orange-800 border-orange-200', false, 2),
('service_provider', 'preferred', 'Preferred', 'Preferred vendor', 'bg-amber-100 text-amber-800 border-amber-200', false, 3),
('service_provider', 'inactive', 'Inactive', 'No longer using services', 'bg-red-100 text-red-800 border-red-200', true, 4);