import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChallengeStatus {
  isActive: boolean;
  hasAccess: boolean;
  currentDay: number;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
}

const fetchChallengeStatus = async (): Promise<ChallengeStatus> => {
  try {
    // Check if there's an active challenge
    const { data: challengeConfig, error: configError } = await supabase
      .from('challenge_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (configError && configError.code !== 'PGRST116') {
      throw configError;
    }

    const challengeExists = !!challengeConfig;
    let currentDay = 1;
    let isWithinChallengePeriod = false;

    if (challengeExists && challengeConfig.start_date) {
      const startDate = new Date(challengeConfig.start_date);
      const endDate = new Date(challengeConfig.end_date);
      const currentDate = new Date();
      
      // Compute totalDays from dates instead of using database value
      const computedTotalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      isWithinChallengePeriod = currentDate >= startDate && currentDate <= endDate;
      
      if (isWithinChallengePeriod) {
        const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        currentDay = Math.max(1, Math.min(daysDiff + 1, computedTotalDays));
      }
      
      // Trust database value for total_days
    }

    return {
      isActive: challengeExists && isWithinChallengePeriod,
      hasAccess: challengeExists,
      currentDay: challengeExists ? currentDay : 1,
      startDate: challengeConfig?.start_date || null,
      endDate: challengeConfig?.end_date || null,
      totalDays: challengeConfig?.total_days || 75
    };

  } catch (error) {
    console.error('Error checking challenge status:', error);
    return {
      isActive: false,
      hasAccess: false,
      currentDay: 1,
      startDate: null,
      endDate: null,
      totalDays: 75
    };
  }
};

export const useChallengeStatus = () => {
  const { data: status, isLoading: loading, refetch } = useQuery({
    queryKey: ['challengeStatus'],
    queryFn: fetchChallengeStatus,
    staleTime: 300000, // 5 minutes - longer cache for config data
    refetchOnWindowFocus: false,
    retry: 1
  });

  return {
    status: status || {
      isActive: false,
      hasAccess: false,
      currentDay: 1,
      startDate: null,
      endDate: null,
      totalDays: 75
    },
    loading,
    refetch
  };
};