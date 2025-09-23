// Legacy compatibility wrapper - use individual hooks instead
import { useBadges } from './useBadges';
import { useRewards } from './useRewards';
import { useGamificationActions } from './useGamificationActions';

// Legacy compatibility wrapper - use individual hooks instead
export function useGamification() {
  const { badges, loading: badgesLoading, refetch: refetchBadges } = useBadges();
  const { rewards, loading: rewardsLoading, claimReward } = useRewards();
  const { 
    checkBadges, 
    checkVariableReward, 
    triggerGamificationEvent, 
    triggerRecentBadgeNotifications 
  } = useGamificationActions();

  return {
    badges,
    rewards,
    guaranteedRewards: [], // TODO: Implement
    loading: badgesLoading || rewardsLoading,
    fetchBadges: refetchBadges,
    fetchRewards: () => {}, // Handled by useRewards
    fetchGuaranteedRewards: () => {}, // TODO: Implement
    checkBadges,
    checkVariableReward,
    checkGuaranteedRewards: () => [], // TODO: Implement
    claimReward,
    triggerGamificationEvent,
    triggerRecentBadgeNotifications
  };
}