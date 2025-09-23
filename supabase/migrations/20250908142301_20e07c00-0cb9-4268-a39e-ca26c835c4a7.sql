-- Create integration_webhooks table for client integrations
CREATE TABLE public.integration_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  integration_type text NOT NULL DEFAULT 'zapier',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one webhook per user per integration type
  CONSTRAINT unique_user_integration UNIQUE (user_id, integration_type)
);

-- Enable RLS
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own integration webhooks"
ON public.integration_webhooks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all webhooks for admin operations
CREATE POLICY "Service role can manage all integration webhooks"
ON public.integration_webhooks
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);