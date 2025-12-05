-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  position TEXT,
  referral_source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entry by email
CREATE POLICY "Users can view own waitlist entry"
  ON public.waitlist FOR SELECT
  USING (email = auth.email());

-- Service role can manage all waitlist entries
CREATE POLICY "Service role can manage waitlist"
  ON public.waitlist FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view and manage waitlist
CREATE POLICY "Admins can manage waitlist"
  ON public.waitlist FOR ALL
  USING (is_admin());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();

-- Insert waitlist mode feature flag into admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'waitlist_mode',
  '{"enabled": false, "auto_approve": false}'::jsonb,
  'Controls waitlist signup mode. When enabled, new signups go to waitlist instead of direct registration.'
)
ON CONFLICT (setting_key) DO NOTHING;