-- Create integration_inbound_tokens table for secure inbound webhook authentication
CREATE TABLE public.integration_inbound_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_preview TEXT NOT NULL, -- First 8 chars for display
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_inbound_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own inbound tokens" 
ON public.integration_inbound_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inbound tokens" 
ON public.integration_inbound_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inbound tokens" 
ON public.integration_inbound_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inbound tokens" 
ON public.integration_inbound_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can manage all tokens for webhook validation
CREATE POLICY "Service role can manage inbound tokens" 
ON public.integration_inbound_tokens 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for fast token lookups
CREATE INDEX idx_integration_inbound_tokens_hash ON public.integration_inbound_tokens(token_hash);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_integration_inbound_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integration_inbound_tokens_updated_at
  BEFORE UPDATE ON public.integration_inbound_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_inbound_tokens_updated_at();