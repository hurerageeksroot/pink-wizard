-- First, check if the user exists for hello@mobilebevpros.com
-- If not, this will be handled by the application when they sign up

-- Seed sample CRM contacts for hello@mobilebevpros.com user
-- We'll use a specific user_id that matches the expected user account
DO $$
DECLARE
    target_user_id UUID := 'c7b3d8e0-5e0b-4b0f-8b3a-3b9b0b1b0b1b'::UUID; -- Placeholder - will be updated when real user signs up
BEGIN
    -- Insert sample contacts
    INSERT INTO public.contacts (
        id, user_id, name, email, company, position, phone, linkedin_url, 
        status, relationship_type, category, source, created_at, last_contact_date,
        next_follow_up, notes, response_received, total_touchpoints, booking_scheduled, archived
    ) VALUES 
    (
        gen_random_uuid(), target_user_id, 'Sarah Johnson', 'sarah.johnson@techcorp.com',
        'TechCorp Solutions', 'Marketing Director', '+1 (555) 123-4567',
        'https://linkedin.com/in/sarahjohnson', 'warm', 'lead', 'corporate_planner',
        'LinkedIn Outreach', '2024-01-15 10:00:00+00', '2024-01-20 14:30:00+00',
        '2024-02-01 09:00:00+00', 'Interested in our Q2 campaign. Has budget allocated.',
        true, 3, false, false
    ),
    (
        gen_random_uuid(), target_user_id, 'Michael Chen', 'm.chen@innovate.io',
        'Innovate.io', 'CEO', NULL, NULL, 'hot', 'past_client', 'venue',
        'Website Contact Form', '2024-01-18 09:15:00+00', '2024-01-22 16:45:00+00',
        '2024-01-25 11:00:00+00', 'Ready to move forward. Scheduled demo for next week.',
        true, 5, true, false
    ),
    (
        gen_random_uuid(), target_user_id, 'Emma Rodriguez', 'emma@creativestudio.com',
        'Creative Studio', 'Event Coordinator', '+1 (555) 987-6543',
        'https://linkedin.com/in/emmarodriguez', 'cold', 'lead', 'wedding_planner',
        'Industry Conference', '2024-01-10 08:30:00+00', '2024-01-12 13:20:00+00',
        '2024-01-30 10:00:00+00', 'Met at the conference. Interested but needs more information.',
        false, 2, false, false
    );

    -- Insert sample activities
    INSERT INTO public.activities (
        id, user_id, contact_id, type, title, description, response_received,
        scheduled_for, completed_at, created_at
    ) VALUES 
    (
        gen_random_uuid(), target_user_id, 
        (SELECT id FROM public.contacts WHERE email = 'sarah.johnson@techcorp.com' AND user_id = target_user_id LIMIT 1),
        'email', 'Initial Outreach Email', 'Sent introduction email about our services',
        true, NULL, '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'
    ),
    (
        gen_random_uuid(), target_user_id,
        (SELECT id FROM public.contacts WHERE email = 'sarah.johnson@techcorp.com' AND user_id = target_user_id LIMIT 1),
        'call', 'Follow-up Call', 'Called to discuss project requirements and timeline',
        true, '2024-01-20 14:30:00+00', '2024-01-20 14:30:00+00', '2024-01-18 09:00:00+00'
    ),
    (
        gen_random_uuid(), target_user_id,
        (SELECT id FROM public.contacts WHERE email = 'm.chen@innovate.io' AND user_id = target_user_id LIMIT 1),
        'meeting', 'Project Demo Meeting', 'Scheduled virtual meeting to demonstrate capabilities',
        false, '2024-01-25 11:00:00+00', NULL, '2024-01-22 16:45:00+00'
    );

END $$;