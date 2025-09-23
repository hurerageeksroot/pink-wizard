-- Manually create trial for sarah@mobilebevpros.com
INSERT INTO user_trials (user_id, status, trial_start_at, trial_end_at)
VALUES (
  'eb213c3a-7a1d-4ef2-a0da-dcc72375e282',
  'active',
  NOW(),
  NOW() + INTERVAL '14 days'
);

-- Grant AI credits for the trial
INSERT INTO ai_credits (user_id, tokens_total, tokens_remaining, source, expires_at, status)
VALUES (
  'eb213c3a-7a1d-4ef2-a0da-dcc72375e282',
  1500,
  1500,
  'trial',
  NOW() + INTERVAL '14 days',
  'active'
);