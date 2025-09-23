-- Add text message activity weight for points system
INSERT INTO public.activity_weights (activity_type, weight, description, is_active)
VALUES ('text', 1.0, 'Text message touchpoints', true)
ON CONFLICT (activity_type) DO NOTHING;