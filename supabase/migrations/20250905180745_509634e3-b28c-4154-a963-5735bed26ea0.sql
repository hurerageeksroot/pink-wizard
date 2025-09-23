-- Create networking_events table since it doesn't exist
CREATE TABLE IF NOT EXISTS public.networking_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    event_name text NOT NULL,
    event_type text NOT NULL DEFAULT 'conference',
    location text,
    event_date date NOT NULL,
    challenge_day integer,
    notes text,
    contacts_met_count integer NOT NULL DEFAULT 0,
    follow_ups_scheduled integer NOT NULL DEFAULT 0,
    outreach_points numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.networking_events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage their own networking events
CREATE POLICY "Users can view their own networking events" 
ON public.networking_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own networking events" 
ON public.networking_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking events" 
ON public.networking_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking events" 
ON public.networking_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create networking_event_contacts junction table
CREATE TABLE IF NOT EXISTS public.networking_event_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    networking_event_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(networking_event_id, contact_id)
);

-- Enable RLS on junction table
ALTER TABLE public.networking_event_contacts ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own networking event contacts
CREATE POLICY "Users can view their own networking event contacts" 
ON public.networking_event_contacts 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.networking_events ne 
    WHERE ne.id = networking_event_contacts.networking_event_id 
    AND ne.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own networking event contacts" 
ON public.networking_event_contacts 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.networking_events ne 
    WHERE ne.id = networking_event_contacts.networking_event_id 
    AND ne.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own networking event contacts" 
ON public.networking_event_contacts 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.networking_events ne 
    WHERE ne.id = networking_event_contacts.networking_event_id 
    AND ne.user_id = auth.uid()
));