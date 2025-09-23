
-- 1) Create enum for structured outreach types (public schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outreach_type') THEN
    CREATE TYPE public.outreach_type AS ENUM ('cold', 'warm', 'social');
  END IF;
END$$;

-- 2) Add structured columns to daily_tasks_definition
ALTER TABLE public.daily_tasks_definition
  ADD COLUMN IF NOT EXISTS outreach_type public.outreach_type,
  ADD COLUMN IF NOT EXISTS count_required integer NOT NULL DEFAULT 1;

-- 3) Optional: lightweight index to speed up filtering by outreach_type
CREATE INDEX IF NOT EXISTS daily_tasks_definition_outreach_type_idx
  ON public.daily_tasks_definition (outreach_type)
  WHERE is_active = true;

-- 4) Best-effort backfill of outreach_type based on task naming conventions
-- Note: This is safe and only updates NULLs. You can adjust names later in the app UI.
UPDATE public.daily_tasks_definition
SET outreach_type = 'cold'
WHERE outreach_type IS NULL AND lower(name) LIKE '%cold%';

UPDATE public.daily_tasks_definition
SET outreach_type = 'warm'
WHERE outreach_type IS NULL AND (lower(name) LIKE '%warm%');

UPDATE public.daily_tasks_definition
SET outreach_type = 'social'
WHERE outreach_type IS NULL AND (
  lower(name) LIKE '%social%' OR
  lower(name) LIKE '%linkedin%' OR
  lower(name) LIKE '%instagram%' OR
  lower(name) LIKE '%facebook%' OR
  lower(name) LIKE '%tiktok%'
);

-- Leave non-outreach tasks with outreach_type = NULL (they won't be auto-completed by outreach reconciliation)
