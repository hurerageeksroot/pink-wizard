-- Migrate crm_settings.cadences from old type-based to new intent-based relationship keys
UPDATE crm_settings
SET cadences = jsonb_set(
  jsonb_set(
    cadences,
    '{relationship}',
    jsonb_build_object(
      'business_lead', COALESCE(
        cadences->'relationship'->'lead',
        cadences->'relationship'->'lead_amplifier',
        '{"enabled": true, "value": 2, "unit": "weeks"}'::jsonb
      ),
      'business_nurture', COALESCE(
        cadences->'relationship'->'past_client',
        cadences->'relationship'->'referral_source',
        cadences->'relationship'->'associate_partner',
        cadences->'relationship'->'booked_client',
        '{"enabled": true, "value": 1, "unit": "months"}'::jsonb
      ),
      'personal_connection', COALESCE(
        cadences->'relationship'->'friend_family',
        '{"enabled": true, "value": 3, "unit": "months"}'::jsonb
      ),
      'civic_engagement', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb,
      'philanthropy_nonprofit', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb,
      'service_provider', COALESCE(
        cadences->'relationship'->'associate_partner',
        '{"enabled": true, "value": 3, "unit": "months"}'::jsonb
      ),
      'media_press', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb,
      'community_member', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb,
      'other_misc', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb
    )
  ),
  '{updated_at}',
  to_jsonb(now())
)
WHERE cadences->'relationship' ? 'lead' 
   OR cadences->'relationship' ? 'past_client' 
   OR cadences->'relationship' ? 'friend_family';