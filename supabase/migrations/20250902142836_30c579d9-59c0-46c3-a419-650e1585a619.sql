-- Insert reward items with proper type casting
INSERT INTO public.reward_items (reward_pack_id, name, description, reward_type, reward_data, weight)
SELECT rp.id, 'Bonus Points', 'Extra points for your achievement', 'points'::reward_type, '{"points": 50}'::jsonb, 5
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration'
UNION ALL
SELECT rp.id, 'Deal Maker Title', 'Earn the Deal Maker title', 'title'::reward_type, '{"title": "Deal Maker", "duration_days": 7}'::jsonb, 3
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration'
UNION ALL
SELECT rp.id, 'Victory Badge', 'Special victory badge', 'badge'::reward_type, '{"badge_name": "Victory Star", "temporary": true}'::jsonb, 2
FROM public.reward_packs rp WHERE rp.name = 'Victory Celebration';