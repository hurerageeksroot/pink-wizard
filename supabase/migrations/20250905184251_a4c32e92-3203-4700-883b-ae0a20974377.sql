-- Add idempotency_key to email_logs table for safe email deduplication
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique index to prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_idempotency_key 
ON public.email_logs (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_timestamp 
ON public.email_logs (recipient_email, created_at);

-- Add index for template-based rate limiting
CREATE INDEX IF NOT EXISTS idx_email_logs_template_recipient_timestamp 
ON public.email_logs (template_key, recipient_email, created_at);