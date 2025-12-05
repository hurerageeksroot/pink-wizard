-- Add new custom relationship types for all users
WITH new_types AS (
  SELECT 
    p.id as user_id,
    unnest(ARRAY['lead_client', 'lead_amplifier', 'associate_colleague', 'strategic_partner']) as name,
    unnest(ARRAY['Lead - Client', 'Lead - Amplifier', 'Associate/Colleague', 'Strategic Partner']) as label,
    unnest(ARRAY['Target', 'TrendingUp', 'Users', 'Handshake']) as icon_name,
    unnest(ARRAY[
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ]) as color_class,
    unnest(ARRAY['business_lead_statuses'::text, 'business_lead_statuses'::text, 'business_nurture_statuses'::text, 'business_nurture_statuses'::text]) as relationship_intent,
    unnest(ARRAY[0, 1, 1, 2]) as sort_order
  FROM profiles p
)
INSERT INTO user_relationship_types (user_id, name, label, icon_name, color_class, relationship_intent, is_default, sort_order, created_at, updated_at)
SELECT user_id, name, label, icon_name, color_class, relationship_intent::relationship_intent, true, sort_order, now(), now()
FROM new_types nt
WHERE NOT EXISTS (
  SELECT 1 FROM user_relationship_types urt 
  WHERE urt.user_id = nt.user_id AND urt.name = nt.name
);

-- Migrate contacts and cleanup old types
UPDATE contacts SET relationship_type = 'lead_client', updated_at = now()
WHERE relationship_type IN ('cold_lead', 'warm_lead', 'hot_lead', 'proposal_sent');

UPDATE contacts SET relationship_type = 'lead_amplifier', updated_at = now()
WHERE relationship_type IN ('referral', 'referral_source');

UPDATE contacts SET relationship_type = 'current_client', updated_at = now()
WHERE relationship_type = 'past_client';

DELETE FROM user_relationship_types
WHERE name IN ('cold_lead', 'warm_lead', 'hot_lead', 'referral', 'proposal_sent', 'lost_maybe_later', 'lost_not_fit', 'past_client', 'partner', 'referral_source', 'associate_partner', 'booked_client');