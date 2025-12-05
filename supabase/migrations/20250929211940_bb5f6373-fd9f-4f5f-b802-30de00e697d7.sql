-- Migration Part 1: Add new enum values to relationship_intent type
ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'business_lead_statuses';
ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'business_nurture_statuses';
ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'personal_statuses';
ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'civic_statuses';
ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'vendor_statuses';