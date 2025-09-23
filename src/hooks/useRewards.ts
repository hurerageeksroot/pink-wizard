import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Reward {
  id: string;
  name: string;
  description: string;
  reward_type: 'badge' | 'points' | 'title' | 'cosmetic';
  reward_data: any;
  earned_at: string;
  is_claimed: boolean;
}

const fetchRewards = async (userId: string): Promise<Reward[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        id,
        earned_at,
        is_claimed,
        reward_items (
          name,
          description,
          reward_type,
          reward_data
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    const userRewards = data?.map(item => ({
      id: item.id,
      name: item.reward_items.name,
      description: item.reward_items.description,
      reward_type: item.reward_items.reward_type,
      reward_data: item.reward_items.reward_data,
      earned_at: item.earned_at,
      is_claimed: item.is_claimed,
    })) || [];

    return userRewards;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
};

export function useRewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading: loading, refetch } = useQuery({
    queryKey: ['rewards', user?.id],
    queryFn: () => fetchRewards(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - match global cache strategy
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection 
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0 // Don't retry failed requests
  });

  // Claim a reward
  const claimReward = async (rewardId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', rewardId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Reward Claimed!",
        description: "Your reward has been successfully claimed.",
      });

      // Invalidate and refetch rewards
      queryClient.invalidateQueries({ queryKey: ['rewards', user.id] });
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return false;
    }
  };

  return {
    rewards: rewards || [],
    loading,
    refetch,
    claimReward
  };
}