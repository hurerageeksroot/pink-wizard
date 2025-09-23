-- Clean up duplicate contacts and add unique constraint to prevent future duplicates

-- First, let's create a temporary table with unique contacts (keeping the oldest one)
CREATE TEMP TABLE unique_contacts AS
SELECT DISTINCT ON (user_id, LOWER(email), LOWER(name), COALESCE(LOWER(company), ''))
    id, user_id, name, email, company, position, phone, linkedin_url, website_url,
    social_media_links, status, relationship_type, category, source, notes,
    response_received, total_touchpoints, booking_scheduled, archived,
    last_contact_date, next_follow_up, created_at, updated_at
FROM contacts
ORDER BY user_id, LOWER(email), LOWER(name), COALESCE(LOWER(company), ''), created_at ASC;

-- Delete all existing contacts
DELETE FROM contacts;

-- Insert back only the unique contacts
INSERT INTO contacts (
    id, user_id, name, email, company, position, phone, linkedin_url, website_url,
    social_media_links, status, relationship_type, category, source, notes,
    response_received, total_touchpoints, booking_scheduled, archived,
    last_contact_date, next_follow_up, created_at, updated_at
)
SELECT 
    id, user_id, name, email, company, position, phone, linkedin_url, website_url,
    social_media_links, status, relationship_type, category, source, notes,
    response_received, total_touchpoints, booking_scheduled, archived,
    last_contact_date, next_follow_up, created_at, updated_at
FROM unique_contacts;

-- Add a unique constraint to prevent future duplicates
-- This will prevent duplicate contacts with the same user_id, email, and name combination
ALTER TABLE contacts 
ADD CONSTRAINT unique_contact_per_user 
UNIQUE (user_id, email, name);

-- Create an index for better performance on the unique constraint
CREATE INDEX IF NOT EXISTS idx_contacts_unique_lookup 
ON contacts (user_id, LOWER(email), LOWER(name));