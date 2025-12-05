-- ================================================================
-- CRITICAL SECURITY FIX: Remove Overly Permissive Third-Party Access
-- ================================================================
-- 
-- Issue: The 'dreamlit_app' database role has unrestricted SELECT access
-- to 80+ tables via policies with qual:true, exposing:
-- - User authentication data (auth.users, sessions, tokens)
-- - All contacts, activities, and revenue data
-- - Payment information
-- - Admin role assignments
-- - Storage objects
-- - And all other application data
--
-- Resolution: Drop all dreamlit_dreamlit_app_select_policy policies
-- as there is no evidence this integration is actively used in the application.
--
-- ================================================================

-- Drop dreamlit policies from public schema tables
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.activities;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.activity_weights;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.admin_audit_log;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.admin_settings;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.ai_credits;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.ai_requests_log;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.ai_tier_quotas;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.ai_usage_monthly;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.badges_definition;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.business_profiles;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.campaign_initiatives;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.campaign_outreach_log;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.challenge_config;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.community_comments;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.community_follows;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.community_posts;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.community_reactions;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.community_reports;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.contact_context_assignments;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.contact_contexts;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.contact_research;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.contacts;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.content_pages;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.crm_settings;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.daily_tasks_definition;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.educational_resources;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.email_logs;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.email_sequence_logs;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.email_sequence_steps;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.email_sequences;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.email_templates;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.guaranteed_rewards_definition;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.integration_inbound_tokens;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.integration_webhooks;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.leaderboard_stats;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.networking_event_contacts;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.networking_events;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.onboarding_tasks_definition;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.payment_access_log;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.payment_audit_log;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.payment_security_status;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.payment_vault;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.payments;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.points_values;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.profiles;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.program_tasks_definition;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.relationship_intent_configs;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.relationship_status_options;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.reward_items;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.reward_packs;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.subscribers;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_badges;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_challenge_goals;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_challenge_progress;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_contact_categories;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_daily_tasks;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_metrics;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_onboarding_tasks;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_points_ledger;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_program_tasks;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_project_goals;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_relationship_category_preferences;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_relationship_types;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_rewards;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_roles;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_trials;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.user_weekly_tasks;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.variable_rewards_config;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.waitlist;
DROP POLICY IF EXISTS dreamlit_dreamlit_app_select_policy ON public.weekly_tasks_definition;

-- Note: We're only dropping policies from public schema as other schemas 
-- (auth, storage, realtime, supabase_migrations, dreamlit) are managed 
-- by Supabase and should not be modified via migrations.

-- Verify remaining policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname = 'dreamlit_dreamlit_app_select_policy';
  
  IF policy_count > 0 THEN
    RAISE NOTICE 'WARNING: % dreamlit policies still remain in public schema', policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All dreamlit policies removed from public schema';
  END IF;
END $$;