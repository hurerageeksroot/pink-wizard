-- Add message_content column to activities table for storing actual touchpoint content
ALTER TABLE activities 
ADD COLUMN message_content TEXT;

COMMENT ON COLUMN activities.message_content IS 'The actual content of the touchpoint (email body, text message, call notes, DM content, etc.) for AI context in future outreach';