-- Add resource_id column to task definition tables for linking to educational resources
ALTER TABLE public.daily_tasks_definition 
ADD COLUMN resource_id UUID REFERENCES public.educational_resources(id);

ALTER TABLE public.weekly_tasks_definition 
ADD COLUMN resource_id UUID REFERENCES public.educational_resources(id);

ALTER TABLE public.program_tasks_definition 
ADD COLUMN resource_id UUID REFERENCES public.educational_resources(id);

ALTER TABLE public.onboarding_tasks_definition 
ADD COLUMN resource_id UUID REFERENCES public.educational_resources(id);