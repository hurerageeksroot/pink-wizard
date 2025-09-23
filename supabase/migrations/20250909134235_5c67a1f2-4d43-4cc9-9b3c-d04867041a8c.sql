-- Create contact_research table for storing research data
CREATE TABLE public.contact_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  research_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_contact_research_contact 
    FOREIGN KEY (contact_id) 
    REFERENCES public.contacts(id) 
    ON DELETE CASCADE,
    
  -- Unique constraint to prevent duplicate research per contact
  UNIQUE(contact_id)
);

-- Enable Row Level Security
ALTER TABLE public.contact_research ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own contact research" 
ON public.contact_research 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact research" 
ON public.contact_research 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact research" 
ON public.contact_research 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact research" 
ON public.contact_research 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_research_updated_at
BEFORE UPDATE ON public.contact_research
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_contact_research_user_id ON public.contact_research(user_id);
CREATE INDEX idx_contact_research_contact_id ON public.contact_research(contact_id);