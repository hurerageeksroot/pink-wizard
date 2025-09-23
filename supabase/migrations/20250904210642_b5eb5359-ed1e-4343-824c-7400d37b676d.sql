-- 1) Add week_numbers to weekly task definitions (null => applies to all weeks)
ALTER TABLE public.weekly_tasks_definition
ADD COLUMN IF NOT EXISTS week_numbers integer[] NULL;

COMMENT ON COLUMN public.weekly_tasks_definition.week_numbers IS
  'List of weeks (1-based) where this task applies; NULL means all weeks';

-- 2) Create user_weekly_tasks to store per-user weekly task instances
CREATE TABLE IF NOT EXISTS public.user_weekly_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  week_number integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_weekly_tasks_unique UNIQUE (user_id, task_id, week_number)
);

-- Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_user_weekly_tasks_user_week
  ON public.user_weekly_tasks (user_id, week_number);

-- 3) Enable RLS and add policies (mirror user-owned task tables)
ALTER TABLE public.user_weekly_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view their weekly tasks
CREATE POLICY "Users can view their weekly tasks"
  ON public.user_weekly_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their weekly tasks
CREATE POLICY "Users can create their weekly tasks"
  ON public.user_weekly_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their weekly tasks
CREATE POLICY "Users can update their weekly tasks"
  ON public.user_weekly_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4) Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_weekly_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_weekly_tasks_updated_at
  BEFORE UPDATE ON public.user_weekly_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_weekly_tasks_updated_at();