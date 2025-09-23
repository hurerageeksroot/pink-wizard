-- Create email sequences table for managing automated email campaigns
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'user_signup', 'challenge_start', 'challenge_complete', etc.
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email sequence steps for individual emails in a sequence
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  template_key TEXT NOT NULL,
  subject_override TEXT,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Create email sequence logs to track sent emails
CREATE TABLE IF NOT EXISTS public.email_sequence_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id),
  step_id UUID NOT NULL REFERENCES public.email_sequence_steps(id),
  user_id UUID NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly tasks definition table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weekly_tasks_definition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user weekly tasks tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_weekly_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_definition_id UUID NOT NULL REFERENCES public.weekly_tasks_definition(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_definition_id, week_number, year)
);

-- Add RLS policies for email sequences
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email sequences" ON public.email_sequences
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view active email sequences" ON public.email_sequences
  FOR SELECT USING (is_active = true);

-- Add RLS policies for email sequence steps
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email sequence steps" ON public.email_sequence_steps
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view active email sequence steps" ON public.email_sequence_steps
  FOR SELECT USING (is_active = true);

-- Add RLS policies for email sequence logs
ALTER TABLE public.email_sequence_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own email sequence logs" ON public.email_sequence_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage email sequence logs" ON public.email_sequence_logs
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Add RLS policies for weekly tasks definition
ALTER TABLE public.weekly_tasks_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage weekly task definitions" ON public.weekly_tasks_definition
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Authenticated users can view active weekly task definitions" ON public.weekly_tasks_definition
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Add RLS policies for user weekly tasks
ALTER TABLE public.user_weekly_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weekly tasks" ON public.user_weekly_tasks
  FOR ALL USING (auth.uid() = user_id AND user_can_write())
  WITH CHECK (auth.uid() = user_id AND user_can_write());
CREATE POLICY "Service role can manage user weekly tasks" ON public.user_weekly_tasks
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger_event ON public.email_sequences(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_sequence_id ON public.email_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_logs_user_id ON public.email_sequence_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_logs_scheduled_for ON public.email_sequence_logs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_weekly_tasks_user_id ON public.user_weekly_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_tasks_week_year ON public.user_weekly_tasks(week_number, year);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_email_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for updating timestamps
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_sequences_updated_at();