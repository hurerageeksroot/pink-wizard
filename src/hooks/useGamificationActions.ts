import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export function useGamificationActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check and award badges for user actions
  const checkBadges = async (eventType: string, eventData?: any) => {
    if (!user) {
      console.log(`🚫 [checkBadges] No user found, skipping badge check for: ${eventType}`);
      return [];
    }

    try {
      console.log(`🎯 [checkBadges] Starting badge check for user ${user.email} with event: ${eventType}`, eventData);
      
      const { data, error } = await supabase.rpc('check_and_award_badges', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_event_data: eventData || {}
      });

      if (error) {
        console.error('❌ [checkBadges] RPC error:', error);
        
        // Handle milestone bonus conflicts gracefully
        if (error.message && (error.message.includes('unique_milestone_bonus') || error.message.includes('milestone'))) {
          console.log('ℹ️ [checkBadges] Milestone bonus already awarded or processing, continuing...');
          return []; // Return empty array instead of throwing
        }
        
        throw error;
      }

      console.log(`🏆 [checkBadges] Badge check result for ${user.email}:`, data);

      // Process new badges
      if (data && data.length > 0) {
        data.forEach((badge: any) => {
          console.log(`🎉 [checkBadges] Processing awarded badge: ${badge.badge_name}`);
          
          // Show toast notification immediately
          toast({
            title: "🏆 Badge Earned!",
            description: `You've earned the "${badge.badge_name}" badge!`,
            duration: 5000,
          });
          
          // Dispatch email notification event immediately
          console.log(`📧 [checkBadges] Dispatching badgeEarned event for: ${badge.badge_name}`);
          window.dispatchEvent(new CustomEvent('badgeEarned', {
            detail: { 
              badgeId: badge.badge_id,
              badgeName: badge.badge_name 
            }
          }));
        });

        // Invalidate relevant caches
        console.log(`🔄 [checkBadges] Invalidating caches after awarding ${data.length} new badges`);
        queryClient.invalidateQueries({ queryKey: ['badges', user.id] });
        queryClient.invalidateQueries({ queryKey: ['points', user.id] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      } else {
        console.log(`ℹ️ [checkBadges] No new badges awarded for ${user.email} on event: ${eventType}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ [checkBadges] Error checking badges:', error);
      return [];
    }
  };

  // Process variable rewards
  const checkVariableReward = async (eventType: string, contextData?: any) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('process_variable_reward', {
        p_user_id: user.id,
        p_event_type: eventType,
        p_context_data: contextData || {}
      });

      if (error) throw error;

      // Show toast for rewards
      data?.forEach((reward: any) => {
        if (reward.reward_earned) {
          toast({
            title: "🎁 Surprise Reward!",
            description: `You've earned: ${reward.reward_name}`,
            duration: 5000,
          });
        }
      });

      // Invalidate relevant caches if any rewards were awarded
      if (data && data.some((r: any) => r.reward_earned)) {
        queryClient.invalidateQueries({ queryKey: ['rewards', user.id] });
        queryClient.invalidateQueries({ queryKey: ['points', user.id] });
      }

      return data || [];
    } catch (error) {
      console.error('Error processing variable reward:', error);
      return [];
    }
  };

  // Combined action trigger (badges + rewards)
  const triggerGamificationEvent = async (eventType: string, eventData?: any) => {
    const [newBadges, newRewards] = await Promise.all([
      checkBadges(eventType, eventData),
      checkVariableReward(eventType, eventData)
    ]);
    
    return { badges: newBadges, rewards: newRewards };
  };

  // Manual notification trigger for recent badges (useful for fixing missed notifications)
  const triggerRecentBadgeNotifications = async () => {
    if (!user) return [];
    
    try {
      console.log('🔄 [triggerRecentBadgeNotifications] Checking for recent badges that might need notifications...');
      
      // Get badges earned in the last 24 hours
      const { data: recentBadges, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge_id,
          badges_definition (
            id,
            name,
            description,
            points_reward
          )
        `)
        .eq('user_id', user.id)
        .gte('earned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('earned_at', { ascending: false });

      if (error) throw error;

      if (recentBadges && recentBadges.length > 0) {
        console.log(`🎯 [triggerRecentBadgeNotifications] Found ${recentBadges.length} recent badges to notify about:`, recentBadges.map(b => b.badges_definition.name));
        
        // Trigger notifications for each recent badge with delays
        recentBadges.forEach((badge, index) => {
          setTimeout(() => {
            // Show toast notification
            toast({
              title: "🏆 Badge Earned!",
              description: `You've earned the "${badge.badges_definition.name}" badge!`,
              duration: 5000,
            });
            
            // Dispatch email notification event
            setTimeout(() => {
              console.log(`📧 [triggerRecentBadgeNotifications] Dispatching badgeEarned event for: ${badge.badges_definition.name}`);
              window.dispatchEvent(new CustomEvent('badgeEarned', {
                detail: { 
                  badgeId: badge.badges_definition.id,
                  badgeName: badge.badges_definition.name 
                }
              }));
            }, 200);
          }, index * 1000); // Stagger notifications by 1 second each
        });
      } else {
        console.log('ℹ️ [triggerRecentBadgeNotifications] No recent badges found to notify about');
      }
      
      return recentBadges || [];
    } catch (error) {
      console.error('❌ [triggerRecentBadgeNotifications] Error triggering recent badge notifications:', error);
      return [];
    }
  };

  // Award points directly
  const awardPoints = async (activityType: string, description: string, metadata?: any) => {
    if (!user) {
      console.log(`🚫 [awardPoints] No user found, skipping points award for: ${activityType}`);
      return false;
    }

    try {
      console.log(`💰 [awardPoints] Starting points award for user ${user.email} with activity: ${activityType}`, { description, metadata });
      
      const { data, error } = await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_description: description,
        p_metadata: metadata || {}
      });

      if (error) {
        console.error('❌ [awardPoints] RPC error:', error);
        throw error;
      }

      console.log(`✅ [awardPoints] Points awarded successfully for ${user.email}:`, data);

      // Centralized cache invalidation after successful points award
      console.log(`🔄 [awardPoints] Invalidating caches after points award`);
      queryClient.invalidateQueries({ queryKey: ['pointsSummary', user.id] });
      queryClient.invalidateQueries({ queryKey: ['pointsDetails', user.id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['badges', user.id] });

      return true;
    } catch (error) {
      console.error('❌ [awardPoints] Error awarding points:', error);
      return false;
    }
  };

  return {
    checkBadges,
    checkVariableReward,
    triggerGamificationEvent,
    triggerRecentBadgeNotifications,
    awardPoints
  };
}