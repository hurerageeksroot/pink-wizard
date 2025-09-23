-- Add the missing writing_style section to admin_settings
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'ai_instructions_writing_style',
  jsonb_build_object(
    'title', 'Writing Style Requirements',
    'description', 'Specific style and tone requirements for generated content',
    'content', E'WRITING STYLE REQUIREMENTS:\n- NEVER use em dashes (--) to replace periods or other punctuation. No use of em dashes at all.\n- Vary sentence structure with a mix of long and short sentences. Interrupt smooth flows occasionally, just enough to feel real, not robotic.\n- Add subtle imperfections like slight redundancy, hesitations (such as "perhaps" or "I think"), to sound more natural.\n- Skip slang or regionalisms. Keep language neutral but still natural. Focus on tone, pacing, and realism.\n- NEVER use sentences with the pattern "It\'s not just about... it\'s about..." - avoid this construction entirely.\n- When referencing previous touchpoints, be natural and specific. Don\'t just say "following up" - reference the actual interaction context.',
    'isActive', true,
    'version', 1
  ),
  'AI instruction section: Writing Style Requirements'
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();