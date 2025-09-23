import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  image_url?: string;
  category: 'milestone' | 'consistency' | 'performance' | 'special';
  rarity: string;
  points_reward: number;
  earned_at?: string;
}

const fetchBadges = async (userId: string): Promise<Badge[]> => {
  try {
    console.log('Fetching badges for user:', userId);
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        earned_at,
        badge_id,
        badges_definition (
          id,
          name,
          description,
          icon_name,
          image_url,
          category,
          rarity,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    console.log('Badge query result:', { data, error });
    if (error) throw error;

    const userBadges = data?.map(item => ({
      id: item.badges_definition.id,
      name: item.badges_definition.name,
      description: item.badges_definition.description,
      icon_name: item.badges_definition.icon_name,
      image_url: item.badges_definition.image_url,
      category: item.badges_definition.category,
      rarity: item.badges_definition.rarity,
      points_reward: item.badges_definition.points_reward,
      earned_at: item.earned_at,
    })) || [];

    return userBadges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
};

export function useBadges() {
  const { user } = useAuth();

  const { data: badges, isLoading: loading, refetch } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: () => fetchBadges(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - match global cache strategy
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0 // Don't retry failed requests
  });

  return {
    badges: badges || [],
    loading,
    refetch
  };
}