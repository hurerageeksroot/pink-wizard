-- Create CRM settings table for auto follow-up cadences
CREATE TABLE public.crm_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  auto_followup_enabled BOOLEAN NOT NULL DEFAULT true,
  cadences JSONB NOT NULL DEFAULT '{
    "status": {
      "cold": {"enabled": true, "value": 1, "unit": "months"},
      "warm": {"enabled": true, "value": 1, "unit": "weeks"},
      "hot": {"enabled": true, "value": 1, "unit": "days"},
      "won": {"enabled": false},
      "lost_maybe_later": {"enabled": true, "value": 3, "unit": "months"},
      "lost_not_fit": {"enabled": false},
      "none": {"enabled": true, "value": 2, "unit": "weeks"}
    },
    "relationship": {
      "lead": {"enabled": true, "value": 2, "unit": "weeks"},
      "lead_amplifier": {"enabled": true, "value": 1, "unit": "weeks"},
      "past_client": {"enabled": true, "value": 3, "unit": "months"},
      "friend_family": {"enabled": true, "value": 6, "unit": "months"},
      "associate_partner": {"enabled": true, "value": 1, "unit": "months"},
      "referral_source": {"enabled": true, "value": 2, "unit": "months"},
      "booked_client": {"enabled": true, "value": 1, "unit": "weeks"}
    },
    "fallback": {"enabled": true, "value": 1, "unit": "months"}
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own CRM settings" 
ON public.crm_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CRM settings" 
ON public.crm_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CRM settings" 
ON public.crm_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CRM settings" 
ON public.crm_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crm_settings_updated_at
BEFORE UPDATE ON public.crm_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();