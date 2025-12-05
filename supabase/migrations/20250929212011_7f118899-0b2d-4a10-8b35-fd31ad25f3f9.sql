-- Migration Part 2: Insert new configs, status options, and migrate existing data

-- Insert new intent configs
INSERT INTO relationship_intent_configs (intent, label, description, icon_name, color_class, default_status)
VALUES
  ('business_lead_statuses', 'Business Lead', 'Potential client relationships', 'Target', 'bg-orange-100 text-orange-800', 'cold'),
  ('business_nurture_statuses', 'Business Nurture', 'Existing business relationships', 'Handshake', 'bg-blue-100 text-blue-800', 'Current Client'),
  ('personal_statuses', 'Personal Connection', 'Friends, family, and personal relationships', 'Heart', 'bg-pink-100 text-pink-800', 'Outer Circle'),
  ('civic_statuses', 'Civic & Community', 'Government, community, and civic organizations', 'Building', 'bg-purple-100 text-purple-800', 'New'),
  ('vendor_statuses', 'Service Provider/Vendor', 'Vendors, suppliers, and service providers', 'Shield', 'bg-teal-100 text-teal-800', 'potential')
ON CONFLICT (intent) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  color_class = EXCLUDED.color_class,
  default_status = EXCLUDED.default_status;

-- Insert new status options
INSERT INTO relationship_status_options (intent, status_key, label, description, color_class, is_terminal, sort_order)
VALUES
  -- Business Lead statuses
  ('business_lead_statuses', 'cold', 'Cold', 'Initial outreach stage', 'bg-blue-100 text-blue-800', false, 1),
  ('business_lead_statuses', 'warm', 'Warm', 'Engaged and interested', 'bg-yellow-100 text-yellow-800', false, 2),
  ('business_lead_statuses', 'hot', 'Hot', 'Ready to close', 'bg-red-100 text-red-800', false, 3),
  ('business_lead_statuses', 'won', 'Won', 'Successfully closed', 'bg-green-100 text-green-800', true, 4),
  ('business_lead_statuses', 'lost - not a fit', 'Lost - Not a Fit', 'Not a good match', 'bg-gray-100 text-gray-800', true, 5),
  ('business_lead_statuses', 'lost - maybe later', 'Lost - Maybe Later', 'Not now but potential future', 'bg-gray-100 text-gray-800', true, 6),
  
  -- Business Nurture statuses
  ('business_nurture_statuses', 'Current Client', 'Current Client', 'Active client', 'bg-green-100 text-green-800', false, 1),
  ('business_nurture_statuses', 'Past Client', 'Past Client', 'Previous client', 'bg-blue-100 text-blue-800', false, 2),
  ('business_nurture_statuses', 'Current Amplifier / Referral Source', 'Current Amplifier / Referral Source', 'Active referrer', 'bg-yellow-100 text-yellow-800', false, 3),
  ('business_nurture_statuses', 'Strategic Partner', 'Strategic Partner', 'Business partnership', 'bg-purple-100 text-purple-800', false, 4),
  ('business_nurture_statuses', 'Donor', 'Donor', 'Financial supporter', 'bg-rose-100 text-rose-800', false, 5),
  ('business_nurture_statuses', 'Past Donor', 'Past Donor', 'Previous donor', 'bg-gray-100 text-gray-800', false, 6),
  
  -- Personal statuses
  ('personal_statuses', 'Friendly / Not Close', 'Friendly / Not Close', 'Casual acquaintance', 'bg-blue-100 text-blue-800', false, 1),
  ('personal_statuses', 'Outer Circle', 'Outer Circle', 'Good friend', 'bg-green-100 text-green-800', false, 2),
  ('personal_statuses', 'Close Circle', 'Close Circle', 'Close friend', 'bg-yellow-100 text-yellow-800', false, 3),
  ('personal_statuses', 'Inner Circle', 'Inner Circle', 'Very close', 'bg-orange-100 text-orange-800', false, 4),
  ('personal_statuses', 'Past Connection', 'Past Connection', 'Former relationship', 'bg-gray-100 text-gray-800', false, 5),
  
  -- Civic statuses
  ('civic_statuses', 'New', 'New', 'New connection', 'bg-blue-100 text-blue-800', false, 1),
  ('civic_statuses', 'Connected', 'Connected', 'Established relationship', 'bg-green-100 text-green-800', false, 2),
  ('civic_statuses', 'Trusted', 'Trusted', 'Strong trusted relationship', 'bg-yellow-100 text-yellow-800', false, 3),
  ('civic_statuses', 'Unaligned', 'Unaligned', 'Different priorities', 'bg-gray-100 text-gray-800', false, 4),
  
  -- Vendor statuses
  ('vendor_statuses', 'potential', 'Potential', 'Considering for use', 'bg-blue-100 text-blue-800', false, 1),
  ('vendor_statuses', 'active', 'Active', 'Currently using', 'bg-green-100 text-green-800', false, 2),
  ('vendor_statuses', 'preferred', 'Preferred', 'Go-to provider', 'bg-yellow-100 text-yellow-800', false, 3)
ON CONFLICT (intent, status_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  color_class = EXCLUDED.color_class,
  is_terminal = EXCLUDED.is_terminal,
  sort_order = EXCLUDED.sort_order;

-- Migrate existing user relationship types
UPDATE user_relationship_types
SET relationship_intent = 'business_lead_statuses'
WHERE relationship_intent = 'business_lead';

UPDATE user_relationship_types
SET relationship_intent = 'business_nurture_statuses'
WHERE relationship_intent IN ('business_nurture', 'philanthropy_nonprofit');

UPDATE user_relationship_types
SET relationship_intent = 'personal_statuses'
WHERE relationship_intent = 'personal_connection';

UPDATE user_relationship_types
SET relationship_intent = 'civic_statuses'
WHERE relationship_intent IN ('civic_engagement', 'community_member');

UPDATE user_relationship_types
SET relationship_intent = 'vendor_statuses'
WHERE relationship_intent = 'service_provider';

UPDATE user_relationship_types
SET relationship_intent = 'other_misc'
WHERE relationship_intent = 'media_press';

-- Disable old category preferences for all users
UPDATE user_relationship_category_preferences
SET is_enabled = false
WHERE category_name IN ('philanthropy_nonprofit', 'media_press');