-- Create user_program_tasks table to track user completion of program tasks
CREATE TABLE public.user_program_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_definition_id UUID NOT NULL REFERENCES public.program_tasks_definition(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_definition_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_program_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own program tasks" 
ON public.user_program_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own program tasks" 
ON public.user_program_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can update their own program tasks" 
ON public.user_program_tasks 
FOR UPDATE 
USING (auth.uid() = user_id AND user_can_write());

CREATE POLICY "Users can delete their own program tasks" 
ON public.user_program_tasks 
FOR DELETE 
USING (auth.uid() = user_id AND user_can_write());

-- Service role can manage all program tasks
CREATE POLICY "Service role can manage program tasks" 
ON public.user_program_tasks 
FOR ALL 
USING (true)
WITH CHECK (user_id IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_program_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_program_tasks_updated_at
BEFORE UPDATE ON public.user_program_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_user_program_tasks_updated_at();