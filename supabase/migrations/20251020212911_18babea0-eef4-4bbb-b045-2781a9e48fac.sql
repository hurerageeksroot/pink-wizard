-- Add contact_specific_goal column to campaign_outreach_log
ALTER TABLE campaign_outreach_log 
ADD COLUMN contact_specific_goal TEXT;