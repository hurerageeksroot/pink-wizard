-- Add relationship_intent column to user_relationship_types if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_relationship_types' 
    AND column_name = 'relationship_intent'
  ) THEN
    ALTER TABLE public.user_relationship_types 
    ADD COLUMN relationship_intent public.relationship_intent DEFAULT 'business_lead';
    
    -- Migrate existing is_lead_type data to relationship_intent
    UPDATE public.user_relationship_types 
    SET relationship_intent = CASE 
      WHEN is_lead_type = true THEN 'business_lead'::public.relationship_intent
      ELSE 'business_nurture'::public.relationship_intent
    END;
  END IF;
END $$;