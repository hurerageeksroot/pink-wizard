-- Update all trigger functions to use the new 5-parameter award_points() signature
-- This fixes task completion and all gamification event point awarding

-- Fix award_networking_points
CREATE OR REPLACE FUNCTION public.award_networking_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  points_value integer := 20;
BEGIN
  -- Award points for networking event with milestone checks skipped
  PERFORM public.award_points(
    NEW.user_id,
    'networking_event',
    'Networking event: ' || NEW.event_name,
    jsonb_build_object(
      'event_id', NEW.id,
      'event_name', NEW.event_name
    ),
    true  -- skip_milestone_checks
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_networking_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix award_community_post_points
CREATE OR REPLACE FUNCTION public.award_community_post_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Award points for community post with milestone checks skipped
  PERFORM public.award_points(
    NEW.user_id,
    'community_post',
    'Community post created',
    jsonb_build_object(
      'post_id', NEW.id,
      'post_type', NEW.post_type
    ),
    true  -- skip_milestone_checks
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_community_post_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix award_community_comment_points
CREATE OR REPLACE FUNCTION public.award_community_comment_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Award points for community comment with milestone checks skipped
  PERFORM public.award_points(
    NEW.user_id,
    'community_comment',
    'Comment added',
    jsonb_build_object(
      'comment_id', NEW.id,
      'post_id', NEW.post_id
    ),
    true  -- skip_milestone_checks
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_community_comment_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix award_contact_won_points
CREATE OR REPLACE FUNCTION public.award_contact_won_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only award points when status changes to 'won'
  IF NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status != 'won') THEN
    PERFORM public.award_points(
      NEW.user_id,
      'contact_won',
      'Contact won: ' || NEW.name,
      jsonb_build_object(
        'contact_id', NEW.id,
        'contact_name', NEW.name
      ),
      true  -- skip_milestone_checks
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_contact_won_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix award_community_reaction_points
CREATE OR REPLACE FUNCTION public.award_community_reaction_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Award points for community reaction with milestone checks skipped
  PERFORM public.award_points(
    NEW.user_id,
    'community_reaction',
    'Reaction added: ' || NEW.reaction_type,
    jsonb_build_object(
      'reaction_id', NEW.id,
      'reaction_type', NEW.reaction_type,
      'post_id', NEW.post_id,
      'comment_id', NEW.comment_id
    ),
    true  -- skip_milestone_checks
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in award_community_reaction_points: %', SQLERRM;
    RETURN NEW;
END;
$function$;