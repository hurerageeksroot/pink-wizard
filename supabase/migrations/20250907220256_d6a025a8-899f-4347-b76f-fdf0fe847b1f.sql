
-- 1) Add a persisted demo flag to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- 2) Server-side demo detection to mirror app logic
CREATE OR REPLACE FUNCTION public.is_demo_contact(
  p_email   text,
  p_source  text,
  p_notes   text,
  p_company text,
  p_name    text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_email   text := lower(coalesce(p_email, ''));
  v_source  text := lower(coalesce(p_source, ''));
  v_notes   text := lower(coalesce(p_notes, ''));
  v_company text := lower(coalesce(p_company, ''));
  v_name    text := lower(coalesce(p_name, ''));
BEGIN
  IF
    -- Email indicators
    v_email ~ '(demo|test|noreply|no-reply|donotreply)'
    OR v_email LIKE '%@mailinator%'
    OR v_email LIKE '%@10minutemail%'
    OR v_email LIKE '%@guerrillamail%'
    OR v_email LIKE '%example.com%'
    OR v_email LIKE '%@sample%'
    OR v_email LIKE '%@fake%'
    OR v_email LIKE '%@dummy%'

    -- Source indicators
    OR v_source ~ '(demo|test|seed|sample|example|fake)'

    -- Notes indicators
    OR v_notes ~ '(demo|test|sample|example|fake|generated)'

    -- Company indicators
    OR v_company ~ '(demo|test|sample|example)'
    OR v_company LIKE '%fake corp%'
    OR v_company LIKE '%acme corp%'

    -- Name indicators
    OR v_name ~ '(demo|test user|sample|example)'
  THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3) BEFORE trigger to auto-set contacts.is_demo
CREATE OR REPLACE FUNCTION public.set_contact_demo_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.is_demo := public.is_demo_contact(NEW.email, NEW.source, NEW.notes, NEW.company, NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_contact_demo_flag_trg ON public.contacts;
CREATE TRIGGER set_contact_demo_flag_trg
BEFORE INSERT OR UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.set_contact_demo_flag();

-- 4) Backfill existing contacts
UPDATE public.contacts
SET is_demo = public.is_demo_contact(email, source, notes, company, name);

-- 5) Performance index
CREATE INDEX IF NOT EXISTS idx_contacts_is_demo ON public.contacts(is_demo);

-- 6) Update points-awarding triggers to skip demo contacts

-- 6a) Contacts: on insert (add contact)
CREATE OR REPLACE FUNCTION public.award_contact_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public
AS $$
BEGIN
  IF NEW.is_demo THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_points(
    NEW.user_id,
    'contact_added',
    'Added contact: ' || NEW.name,
    jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
  );
  RETURN NEW;
END;
$$;

-- 6b) Contacts: on update (won or response)
CREATE OR REPLACE FUNCTION public.award_contact_won_points() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public
AS $$
BEGIN
  IF NEW.is_demo THEN
    RETURN NEW;
  END IF;

  -- Award points when status changes to 'won'
  IF OLD.status != 'won' AND NEW.status = 'won' THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_won',
      'Won contact: ' || NEW.name,
      jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
    );
  END IF;

  -- Award points for response received
  IF OLD.response_received = false AND NEW.response_received = true THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_response',
      'Received response from: ' || NEW.name,
      jsonb_build_object('contact_id', NEW.id, 'contact_name', NEW.name)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 6c) Activities: on insert (touchpoint logged) – check related contact
CREATE OR REPLACE FUNCTION public.award_activity_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_demo boolean;
BEGIN
  SELECT is_demo INTO v_is_demo
  FROM public.contacts
  WHERE id = NEW.contact_id;

  IF coalesce(v_is_demo, false) THEN
    RETURN NEW;
  END IF;

  PERFORM public.award_points(
    NEW.user_id,
    'touchpoint_logged',
    'Logged touchpoint: ' || NEW.title,
    jsonb_build_object('activity_id', NEW.id, 'contact_id', NEW.contact_id, 'activity_type', NEW.type)
  );

  RETURN NEW;
END;
$$;

-- (Trigger definitions already exist; replacing the function body is sufficient)

-- 7) Badge triggers: skip for demo contacts and exclude demo in badge checks

-- 7a) Trigger helpers
CREATE OR REPLACE FUNCTION public.trigger_badge_check_on_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_demo THEN
    RETURN NEW;
  END IF;
  -- Use a random chance to reduce frequency
  IF random() < 0.3 THEN
    PERFORM check_and_award_badges(NEW.user_id, 'contact_added', jsonb_build_object('contact_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.trigger_badge_check_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_demo THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'won' THEN
    PERFORM check_and_award_badges(NEW.user_id, 'contact_won', jsonb_build_object('contact_id', NEW.id));
  ELSIF OLD.revenue_amount IS DISTINCT FROM NEW.revenue_amount AND NEW.revenue_amount > OLD.revenue_amount THEN
    IF random() < 0.5 THEN
      PERFORM check_and_award_badges(NEW.user_id, 'revenue_updated', jsonb_build_object('contact_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7b) Ensure badge checker excludes demo contacts for its counts
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(badge_id uuid, badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  user_count INTEGER;
  already_has_badge BOOLEAN;
  recent_check BOOLEAN;
BEGIN
  -- Throttle repeated checks
  SELECT EXISTS(
    SELECT 1 FROM user_points_ledger 
    WHERE user_id = p_user_id 
      AND activity_type = 'badge_check_throttle' 
      AND created_at > now() - interval '5 seconds'
  ) INTO recent_check;

  IF recent_check THEN
    RETURN;
  END IF;

  INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
  VALUES (
    p_user_id, 
    'badge_check_throttle', 
    0, 
    'Badge check throttle',
    jsonb_build_object('event_type', p_event_type, 'timestamp', now())
  );

  FOR badge_record IN 
    SELECT bd.id, bd.name, bd.criteria, bd.points_reward, bd.category
    FROM badges_definition bd 
    WHERE bd.is_active = true
    ORDER BY bd.id
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = p_user_id AND ub.badge_id = badge_record.id
    ) INTO already_has_badge;

    IF already_has_badge THEN
      CONTINUE;
    END IF;

    IF badge_record.criteria->>'type' = 'contacts_added' THEN
      SELECT COUNT(*) INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id
        AND c.is_demo = false;

      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());

        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 'badge_earned', badge_record.points_reward,
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true, 'awarded_by_system', true)
        );

        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;

    ELSIF badge_record.criteria->>'type' = 'contacts_won' THEN
      SELECT COUNT(*) INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id
        AND c.status = 'won'
        AND c.is_demo = false;

      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());

        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 'badge_earned', badge_record.points_reward,
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true, 'awarded_by_system', true)
        );

        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;

    ELSIF badge_record.criteria->>'type' = 'total_revenue' THEN
      SELECT COALESCE(SUM(revenue_amount), 0)::integer INTO user_count
      FROM contacts c
      WHERE c.user_id = p_user_id
        AND c.is_demo = false;

      IF user_count >= (badge_record.criteria->>'threshold')::integer THEN
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (p_user_id, badge_record.id, now());

        INSERT INTO user_points_ledger (user_id, activity_type, points_earned, description, metadata)
        VALUES (
          p_user_id, 'badge_earned', badge_record.points_reward,
          'Earned badge: ' || badge_record.name,
          jsonb_build_object('badge_id', badge_record.id, 'badge_name', badge_record.name, 'skip_badge_check', true, 'awarded_by_system', true)
        );

        RETURN QUERY SELECT badge_record.id, badge_record.name;
      END IF;
    END IF;

  END LOOP;

  DELETE FROM user_points_ledger 
  WHERE activity_type = 'badge_check_throttle' 
    AND created_at < now() - interval '1 hour';
END;
$$;

-- 8) Exclude demo contacts from revenue leaderboard
CREATE OR REPLACE FUNCTION public.get_revenue_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_revenue numeric,
  won_deals bigint,
  total_contacts bigint,
  rank_position bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $function$
  WITH active_challenge AS (
    SELECT start_date, end_date
    FROM public.challenge_config
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  ),
  participants AS (
    SELECT ucp.user_id
    FROM public.user_challenge_progress ucp
    WHERE ucp.is_active = true
  )
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(c.revenue_amount), 0) AS total_revenue,
    COUNT(c.id) FILTER (WHERE c.status = 'won') AS won_deals,
    COUNT(c.id) AS total_contacts,
    DENSE_RANK() OVER (ORDER BY COALESCE(SUM(c.revenue_amount), 0) DESC) AS rank_position
  FROM public.profiles p
  JOIN participants part ON part.user_id = p.id
  LEFT JOIN public.contacts c
    ON c.user_id = p.id
    AND c.status = 'won'
    AND c.is_demo = false
    AND EXISTS (SELECT 1 FROM active_challenge)
    AND c.updated_at::date BETWEEN (SELECT start_date FROM active_challenge) AND (SELECT end_date FROM active_challenge)
  WHERE p.show_in_leaderboard = true
  GROUP BY p.id, p.display_name, p.avatar_url
  ORDER BY total_revenue DESC;
$function$;
