
-- 1) Create per-user rolling trial table with RLS and integrity checks
CREATE TABLE IF NOT EXISTS public.user_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trial_start_at timestamptz NOT NULL DEFAULT now(),
  trial_end_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  status text NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'canceled'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_trials' AND policyname = 'service_role_manage_user_trials'
  ) THEN
    CREATE POLICY "service_role_manage_user_trials"
      ON public.user_trials
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_trials' AND policyname = 'users_view_own_trials'
  ) THEN
    CREATE POLICY "users_view_own_trials"
      ON public.user_trials
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_trials' AND policyname = 'users_create_own_trial'
  ) THEN
    CREATE POLICY "users_create_own_trial"
      ON public.user_trials
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_trials' AND policyname = 'users_update_own_trial'
  ) THEN
    CREATE POLICY "users_update_own_trial"
      ON public.user_trials
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Partial unique index to enforce only one active trial per user
CREATE UNIQUE INDEX IF NOT EXISTS user_trials_one_active_per_user
  ON public.user_trials (user_id)
  WHERE status = 'active';

-- Integrity trigger to enforce 14-day window and prevent tampering
CREATE OR REPLACE FUNCTION public.validate_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user_id matches authenticated user for non-service operations
  IF auth.role() != 'service_role' AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Normalize start/end window
    IF NEW.trial_start_at IS NULL THEN
      NEW.trial_start_at := now();
    END IF;
    NEW.trial_end_at := NEW.trial_start_at + interval '14 days';

    -- Only allow 'active' at creation (users cannot self-insert expired/canceled)
    IF auth.role() != 'service_role' THEN
      NEW.status := 'active';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Keep updated_at fresh
    NEW.updated_at := now();

    -- Prevent changing critical fields by non-service role
    IF auth.role() != 'service_role' THEN
      IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
      END IF;
      IF NEW.trial_start_at <> OLD.trial_start_at OR NEW.trial_end_at <> OLD.trial_end_at THEN
        RAISE EXCEPTION 'Cannot modify trial start/end';
      END IF;
      -- Allow users to cancel their trial (set status to 'canceled'), forbid other arbitrary statuses
      IF NEW.status NOT IN ('active','canceled') THEN
        RAISE EXCEPTION 'Invalid status update';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_trial ON public.user_trials;
CREATE TRIGGER trg_validate_user_trial
BEFORE INSERT OR UPDATE ON public.user_trials
FOR EACH ROW EXECUTE PROCEDURE public.validate_user_trial();

-- 2) Helper functions

-- a) Per-user active trial checker
CREATE OR REPLACE FUNCTION public.user_has_active_trial()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  has_trial boolean := false;
BEGIN
  SELECT auth.uid() INTO uid;
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_trials ut
    WHERE ut.user_id = uid
      AND ut.status = 'active'
      AND now() < ut.trial_end_at
  ) INTO has_trial;

  RETURN has_trial;
END;
$$;

-- b) Is the current user a participant in the active challenge?
CREATE OR REPLACE FUNCTION public.user_is_challenge_participant()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  s_date date;
  e_date date;
  is_participant boolean := false;
BEGIN
  SELECT auth.uid() INTO uid;
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- Get current active challenge window (if any)
  SELECT start_date, end_date
  INTO s_date, e_date
  FROM public.challenge_config
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF s_date IS NULL OR e_date IS NULL THEN
    RETURN false;
  END IF;

  -- Must be within the active window and have an active progress row
  IF CURRENT_DATE BETWEEN s_date AND e_date THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_challenge_progress ucp
      WHERE ucp.user_id = uid
        AND ucp.is_active = true
    ) INTO is_participant;

    RETURN COALESCE(is_participant, false);
  END IF;

  RETURN false;
END;
$$;

-- 3) Update user_can_write() to use subscription, payments, trial, or active challenge participant
CREATE OR REPLACE FUNCTION public.user_can_write()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  has_valid_subscription BOOLEAN := FALSE;
  has_valid_payment BOOLEAN := FALSE;
  has_trial BOOLEAN := FALSE;
  is_challenge_participant BOOLEAN := FALSE;
BEGIN
  -- Check subscription
  SELECT EXISTS(
    SELECT 1 
    FROM public.subscribers 
    WHERE user_id = auth.uid() 
      AND subscribed = true 
      AND (subscription_end IS NULL OR subscription_end > now())
  ) INTO has_valid_subscription;

  IF has_valid_subscription THEN
    RETURN TRUE;
  END IF;

  -- Check payment access
  SELECT EXISTS(
    SELECT 1 
    FROM public.payments 
    WHERE user_id = auth.uid() 
      AND status IN ('paid', 'demo')
      AND access_expires_at > now()
  ) INTO has_valid_payment;

  IF has_valid_payment THEN
    RETURN TRUE;
  END IF;

  -- Check per-user 14-day trial
  has_trial := public.user_has_active_trial();
  IF has_trial THEN
    RETURN TRUE;
  END IF;

  -- Check current challenge participation (only for current challenge; future challenges are paid anyway)
  is_challenge_participant := public.user_is_challenge_participant();
  IF is_challenge_participant THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;
