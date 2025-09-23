-- Add unique constraint to prevent duplicate enrollments (ignore if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_challenge_progress_user_id_key' 
        AND table_name = 'user_challenge_progress'
    ) THEN
        ALTER TABLE public.user_challenge_progress 
        ADD CONSTRAINT user_challenge_progress_user_id_key UNIQUE (user_id);
    END IF;
END
$$;