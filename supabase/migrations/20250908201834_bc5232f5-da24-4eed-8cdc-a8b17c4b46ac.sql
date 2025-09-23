-- Remove redundant database triggers to simplify the system
-- We'll keep the client-side gamification calls and remove the automatic database triggers

-- Drop the redundant contact points trigger (client-side handles this)
DROP TRIGGER IF EXISTS contact_points_trigger ON public.contacts;

-- Drop the badge trigger on contact insert (client-side handles this)  
DROP TRIGGER IF EXISTS award_badges_on_contact_insert ON public.contacts;

-- Keep the contact status trigger for won contacts since that's status-change specific
-- Keep other necessary triggers for data integrity