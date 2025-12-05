-- Migrate existing crm_settings cadences from flat status-based to intent-based structure
-- This transforms the JSONB data to support the new grouped relationship architecture

UPDATE public.crm_settings
SET cadences = jsonb_build_object(
  'business_lead_statuses', jsonb_build_object(
    'cold', COALESCE(cadences->'status'->'cold', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb),
    'warm', COALESCE(cadences->'status'->'warm', '{"enabled": true, "value": 1, "unit": "weeks"}'::jsonb),
    'hot', COALESCE(cadences->'status'->'hot', '{"enabled": true, "value": 3, "unit": "days"}'::jsonb),
    'won', COALESCE(cadences->'status'->'won', '{"enabled": false}'::jsonb),
    'lost_not_fit', COALESCE(cadences->'status'->'lost_not_fit', '{"enabled": false}'::jsonb),
    'lost_maybe_later', COALESCE(cadences->'status'->'lost_maybe_later', '{"enabled": true, "value": 3, "unit": "months"}'::jsonb)
  ),
  'business_nurture_statuses', jsonb_build_object(
    'current_client', '{"enabled": true, "value": 1, "unit": "weeks"}'::jsonb,
    'past_client', '{"enabled": true, "value": 3, "unit": "months"}'::jsonb,
    'current_amplifier', '{"enabled": true, "value": 2, "unit": "weeks"}'::jsonb,
    'strategic_partner', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb,
    'donor', '{"enabled": true, "value": 3, "unit": "months"}'::jsonb,
    'past_donor', '{"enabled": true, "value": 6, "unit": "months"}'::jsonb
  ),
  'personal_statuses', jsonb_build_object(
    'friendly_not_close', '{"enabled": true, "value": 3, "unit": "months"}'::jsonb,
    'outer_circle', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb,
    'close_circle', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb,
    'inner_circle', '{"enabled": true, "value": 2, "unit": "weeks"}'::jsonb,
    'past_connection', '{"enabled": true, "value": 6, "unit": "months"}'::jsonb
  ),
  'civic_statuses', jsonb_build_object(
    'new', COALESCE(cadences->'status'->'new', '{"enabled": true, "value": 1, "unit": "weeks"}'::jsonb),
    'connected', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb,
    'trusted', '{"enabled": true, "value": 2, "unit": "months"}'::jsonb,
    'unaligned', '{"enabled": false}'::jsonb
  ),
  'vendor_statuses', jsonb_build_object(
    'potential', '{"enabled": true, "value": 2, "unit": "weeks"}'::jsonb,
    'active', '{"enabled": true, "value": 1, "unit": "months"}'::jsonb,
    'preferred', '{"enabled": true, "value": 3, "unit": "months"}'::jsonb
  ),
  'fallback', COALESCE(cadences->'fallback', '{"enabled": true, "value": 2, "unit": "weeks"}'::jsonb)
)
WHERE cadences ? 'status'  -- Only update if old flat structure exists
  AND NOT (cadences ? 'business_lead_statuses');  -- Skip if already migrated