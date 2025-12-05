-- Add offer_type column to campaign_initiatives table
ALTER TABLE campaign_initiatives 
ADD COLUMN offer_type text DEFAULT 'campaign' 
CHECK (offer_type IN ('campaign', 'evergreen'));

-- Add comment explaining the column
COMMENT ON COLUMN campaign_initiatives.offer_type IS 'Type of initiative: campaign (time-bound) or evergreen (always available)';

-- Update existing records to explicitly set offer_type
UPDATE campaign_initiatives 
SET offer_type = 'campaign' 
WHERE offer_type IS NULL;