-- Add default values to required fields to prevent null constraint violations
-- daily_tasks_definition
ALTER TABLE public.daily_tasks_definition 
ALTER COLUMN count_required SET DEFAULT 1;

-- Make sure sort_order has proper defaults across all task definition tables
ALTER TABLE public.daily_tasks_definition 
ALTER COLUMN sort_order SET DEFAULT 0;

ALTER TABLE public.weekly_tasks_definition 
ALTER COLUMN sort_order SET DEFAULT 0;

ALTER TABLE public.program_tasks_definition 
ALTER COLUMN sort_order SET DEFAULT 0;

ALTER TABLE public.onboarding_tasks_definition 
ALTER COLUMN sort_order SET DEFAULT 0;