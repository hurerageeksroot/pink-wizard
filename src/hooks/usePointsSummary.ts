import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useChallenge } from './useChallenge';

interface PointsSummary {
  total_points: number;
  badges_earned?: number;
  current_streak?: number;
  days_completed?: number;
  display_name?: string;
  user_id?: string;
  total_activities?: number;
  last_activity?: string;
  is_challenge_points?: boolean;
}

const fetchPointsSummary = async (userId: string, isChallengeParticipant: boolean): Promise<PointsSummary> => {
  try {
    if (isChallengeParticipant) {
      // Use challenge-specific points for challenge participants
      const { data: challengeData, error: challengeError } = await supabase
        .rpc('get_user_challenge_points_summary', { target_user_id: userId });

      if (challengeError) {
        console.error('Error fetching challenge points summary:', challengeError);
        // Fallback to regular points if challenge function fails
        return await fetchRegularPointsSummary(userId, false);
      }

      const challengePoints = challengeData?.[0];
      if (challengePoints) {
        return {
          total_points: Number(challengePoints.total_points) || 0,
          total_activities: Number(challengePoints.total_activities) || 0,
          display_name: challengePoints.display_name,
          user_id: userId,
          is_challenge_points: true
        };
      }
    }

    // Use regular all-time points for non-challenge participants
    return await fetchRegularPointsSummary(userId, false);
  } catch (error) {
    console.error('Error fetching points summary:', error);
    return { total_points: 0, total_activities: 0, is_challenge_points: false };
  }
};

const fetchRegularPointsSummary = async (userId: string, isChallengePoints: boolean): Promise<PointsSummary> => {
  try {
    // Get points summary from view
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('Error fetching points summary:', pointsError);
    }

    // Get actual activities count from activities table
    const { count: activitiesCount, error: activitiesError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (activitiesError) {
      console.error('Error fetching activities count:', activitiesError);
    }

    // Combine the data
    return {
      ...(pointsData || { total_points: 0 }),
      total_activities: activitiesCount || 0,
      is_challenge_points: isChallengePoints
    };
  } catch (error) {
    console.error('Error fetching points summary:', error);
    return { total_points: 0, total_activities: 0, is_challenge_points: false };
  }
};

export function usePointsSummary() {
  const { user } = useAuth();
  const { isChallengeParticipant } = useChallenge();

  const { data: pointsSummary, isLoading: loading, refetch } = useQuery({
    queryKey: ['pointsSummary', user?.id, isChallengeParticipant],
    queryFn: () => fetchPointsSummary(user!.id, isChallengeParticipant),
    enabled: !!user,
    staleTime: 30000, // 30 seconds - points can change frequently
    refetchOnWindowFocus: false,
    retry: 1
  });

  return {
    pointsSummary: pointsSummary || { total_points: 0, total_activities: 0, is_challenge_points: false },
    loading,
    refetch
  };
}