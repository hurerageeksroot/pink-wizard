import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ChallengeGoals {
  goals_id: string | null;
  leads_goal: number;
  events_goal: number;
  revenue_goal: number;
  leads_current: number;
  events_current: number;
  revenue_current: number;
  leads_progress: number;
  events_progress: number;
  revenue_progress: number;
  created_at: string | null;
  updated_at: string | null;
}

// In-flight request deduplication
let inFlightRequest: Promise<ChallengeGoals | null> | null = null;

const fetchChallengeGoals = async (userId: string): Promise<ChallengeGoals | null> => {
  // Return existing in-flight request if one exists
  if (inFlightRequest) {
    console.log('🔄 [useChallengeGoals] Reusing in-flight request');
    return inFlightRequest;
  }

  // Create new request and cache it
  inFlightRequest = (async () => {
    try {
      console.log('🚀 [useChallengeGoals] Making RPC call to get_my_challenge_goals_and_progress');
      const { data, error } = await supabase.rpc('get_my_challenge_goals_and_progress');
      
      if (error) {
        console.warn('Challenge goals RPC error (expected if no goals set):', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    } finally {
      // Clear the in-flight request once completed
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
};

export const useChallengeGoals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for challenge goals with stronger caching
  const { data: goals, isLoading, refetch } = useQuery({
    queryKey: ['challengeGoals', user?.id],
    queryFn: () => fetchChallengeGoals(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - much longer cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0, // Don't retry failed requests
    placeholderData: keepPreviousData
  });

  const saveGoals = async (leadsGoal: number, eventsGoal: number, revenueGoal: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_challenge_goals')
        .upsert({
          user_id: user.id,
          leads_goal: leadsGoal,
          events_goal: eventsGoal,
          revenue_goal: revenueGoal,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Goals saved",
        description: "Your challenge goals have been updated successfully.",
      });

      // Invalidate and refetch using React Query
      await queryClient.invalidateQueries({ 
        queryKey: ['challengeGoals', user.id],
        exact: true 
      });
      
      return true;
    } catch (error) {
      console.error('Error saving challenge goals:', error);
      toast({
        title: "Error saving goals",
        description: "Failed to save your challenge goals.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    goals: goals || null,
    loading: isLoading,
    saveGoals,
    refetch: () => refetch(),
  };
};