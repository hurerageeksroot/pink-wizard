
-- 1) Add scopes column to existing integration_inbound_tokens for dual use (inbound + outbound)
ALTER TABLE public.integration_inbound_tokens
ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT ARRAY['inbound']::text[];

-- 2) Restrict scopes to only allowed values and ensure non-empty array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integration_inbound_tokens_scopes_check'
  ) THEN
    ALTER TABLE public.integration_inbound_tokens
    ADD CONSTRAINT integration_inbound_tokens_scopes_check
    CHECK (
      scopes IS NOT NULL
      AND array_length(scopes, 1) >= 1
      AND scopes <@ ARRAY['inbound','outbound']::text[]
    );
  END IF;
END $$;

-- 3) Ensure token_hash is unique and indexed for fast lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'integration_inbound_tokens_token_hash_key'
  ) THEN
    CREATE UNIQUE INDEX integration_inbound_tokens_token_hash_key
    ON public.integration_inbound_tokens (token_hash);
  END IF;
END $$;

-- 4) Backfill: make sure all existing rows have the default scopes (handled by DEFAULT, but enforce explicitly)
UPDATE public.integration_inbound_tokens
SET scopes = ARRAY['inbound']::text[]
WHERE scopes IS NULL;

-- Note:
-- - Existing RLS policies and the trigger to update updated_at remain unchanged.
-- - Frontend will expose a toggle to add/remove 'outbound' from scopes per token.
