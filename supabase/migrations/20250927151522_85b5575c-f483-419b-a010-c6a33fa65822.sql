-- Add relationship_status column to replace status if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' 
    AND column_name = 'relationship_status'
  ) THEN
    ALTER TABLE public.contacts 
    ADD COLUMN relationship_status text DEFAULT 'new';
    
    -- Migrate existing status data to relationship_status
    UPDATE public.contacts 
    SET relationship_status = CASE status
      WHEN 'none' THEN 'new'
      WHEN 'cold' THEN 'cold'  
      WHEN 'warm' THEN 'warm'
      WHEN 'hot' THEN 'hot'
      WHEN 'won' THEN 'won'
      WHEN 'lost_maybe_later' THEN 'lost_maybe_later'
      WHEN 'lost_not_fit' THEN 'lost_not_fit'
      ELSE 'new'
    END;
  END IF;
END $$;