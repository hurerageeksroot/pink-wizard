-- Update the get_my_ai_quota function to give unlimited tokens to challenge participants
CREATE OR REPLACE FUNCTION public.get_my_ai_quota()
RETURNS TABLE(tier text, monthly_quota integer, monthly_used integer, credits_remaining integer, per_request_limit integer, remaining integer, period_start date, period_end date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_period_start DATE;
  v_tier TEXT := 'Free';
  v_monthly_quota INTEGER := 10000;
  v_per_request_limit INTEGER := 1500;
  v_monthly_used INTEGER := 0;
  v_credits_remaining INTEGER := 0;
  v_subscribed BOOLEAN := false;
  v_sub_tier TEXT;
  v_period_end DATE;
  v_is_admin BOOLEAN := false;
  v_is_challenge_participant BOOLEAN := false;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  IF v_user_id IS NULL THEN
    -- Not authenticated; return zeros with Free tier defaults
    v_period_start := date_trunc('month', now())::date;
    v_period_end := (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date;
    RETURN QUERY SELECT v_tier, v_monthly_quota, 0, 0, v_per_request_limit, v_monthly_quota, v_period_start, v_period_end;
    RETURN;
  END IF;

  v_period_start := date_trunc('month', now())::date;
  v_period_end := (date_trunc('month', now()) + INTERVAL '1 month - 1 day')::date;

  -- Check if user is admin first (admins get unlimited quota)
  SELECT is_admin(v_user_id) INTO v_is_admin;
  
  -- Check if user is active challenge participant (they also get unlimited quota)
  SELECT user_is_challenge_participant() INTO v_is_challenge_participant;
  
  IF v_is_admin OR v_is_challenge_participant THEN
    -- Admins and challenge participants get unlimited quotas
    RETURN QUERY SELECT 
      CASE 
        WHEN v_is_admin THEN 'Admin'::text
        ELSE 'Challenge Participant'::text
      END as tier,
      999999999::integer as monthly_quota,
      v_monthly_used,
      0::integer as credits_remaining,
      999999999::integer as per_request_limit,
      999999999::integer as remaining,
      v_period_start,
      v_period_end;
    RETURN;
  END IF;

  -- Determine subscription tier if present
  SELECT s.subscribed, s.subscription_tier
  INTO v_subscribed, v_sub_tier
  FROM public.subscribers s
  WHERE s.user_id = v_user_id
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF COALESCE(v_subscribed, false) AND v_sub_tier IS NOT NULL THEN
    v_tier := v_sub_tier; -- Expected values: 'Basic' | 'Premium' | 'Enterprise'
  ELSE
    v_tier := 'Free';
  END IF;

  -- Load tier quotas if configured
  SELECT 
    atq.monthly_token_quota, 
    atq.per_request_token_limit
  INTO 
    v_monthly_quota, 
    v_per_request_limit
  FROM public.ai_tier_quotas atq
  WHERE atq.tier = v_tier
  LIMIT 1;

  -- Fallbacks if no matching row
  v_monthly_quota := COALESCE(v_monthly_quota, 10000);
  v_per_request_limit := COALESCE(v_per_request_limit, 1500);

  -- Current monthly usage (properly qualified column reference)
  SELECT aum.tokens_used INTO v_monthly_used
  FROM public.ai_usage_monthly aum
  WHERE aum.user_id = v_user_id AND aum.period_start = v_period_start
  LIMIT 1;

  v_monthly_used := COALESCE(v_monthly_used, 0);

  -- Active credits
  SELECT COALESCE(SUM(ac.tokens_remaining), 0) INTO v_credits_remaining
  FROM public.ai_credits ac
  WHERE ac.user_id = v_user_id
    AND ac.status = 'active'
    AND (ac.expires_at IS NULL OR ac.expires_at > now());

  RETURN QUERY SELECT 
    v_tier,
    v_monthly_quota,
    v_monthly_used,
    v_credits_remaining,
    v_per_request_limit,
    GREATEST(v_monthly_quota - v_monthly_used, 0) + v_credits_remaining,
    v_period_start,
    v_period_end;
END;
$function$;