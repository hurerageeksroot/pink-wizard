-- First, add missing enum values to relationship_intent enum if they don't exist
DO $$
BEGIN
    -- Add missing enum values one by one (only if they don't exist)
    BEGIN
        ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'civic_engagement';
    EXCEPTION WHEN duplicate_object THEN
        -- Value already exists, continue
        NULL;
    END;
    
    BEGIN
        ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'philanthropy_nonprofit';
    EXCEPTION WHEN duplicate_object THEN
        -- Value already exists, continue
        NULL;
    END;
    
    BEGIN  
        ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'service_provider';
    EXCEPTION WHEN duplicate_object THEN
        -- Value already exists, continue
        NULL;
    END;
    
    BEGIN
        ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'media_press';
    EXCEPTION WHEN duplicate_object THEN
        -- Value already exists, continue
        NULL;
    END;
    
    BEGIN
        ALTER TYPE relationship_intent ADD VALUE IF NOT EXISTS 'other_misc';
    EXCEPTION WHEN duplicate_object THEN
        -- Value already exists, continue
        NULL;
    END;
END$$;