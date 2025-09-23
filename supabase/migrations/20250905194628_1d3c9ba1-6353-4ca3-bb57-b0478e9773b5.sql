-- Add external link fields to task definition tables
ALTER TABLE daily_tasks_definition 
ADD COLUMN external_link TEXT,
ADD COLUMN external_link_text TEXT;

ALTER TABLE weekly_tasks_definition 
ADD COLUMN external_link TEXT,
ADD COLUMN external_link_text TEXT;

ALTER TABLE program_tasks_definition 
ADD COLUMN external_link TEXT,
ADD COLUMN external_link_text TEXT;

ALTER TABLE onboarding_tasks_definition 
ADD COLUMN external_link TEXT,
ADD COLUMN external_link_text TEXT;