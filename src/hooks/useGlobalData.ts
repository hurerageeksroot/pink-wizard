import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/hooks/useAccess';

interface GlobalDataState {
  hasContacts: boolean;
  hasSubscription: boolean;
  challengeParticipant: boolean;
  loading: boolean;
}

interface GlobalDataContextType extends GlobalDataState {
  refetch: () => Promise<void>;
}

const GlobalDataContext = createContext<GlobalDataContextType | null>(null);

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within GlobalDataProvider');
  }
  return context;
};

// In-flight request deduplication to prevent duplicate API calls
const inflightRequests = new Map<string, Promise<any>>();

const fetchGlobalData = async (userId: string) => {
  const cacheKey = `globalData-${userId}`;
  
  // Return existing in-flight request if available
  if (inflightRequests.has(cacheKey)) {
    console.log('[useGlobalData] Using in-flight request for', userId);
    return inflightRequests.get(cacheKey)!;
  }
  
  // Create new request
  console.log('[useGlobalData] Creating new request for', userId);
  const promise = (async () => {
    try {
      const [contactsResult, challengeResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .limit(1),
        supabase
          .from('user_challenge_progress')
          .select('is_active', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)
      ]);

      return {
        hasContacts: (contactsResult.count || 0) > 0,
        challengeParticipant: (challengeResult.count || 0) > 0
      };
    } finally {
      // Clean up after request completes
      inflightRequests.delete(cacheKey);
    }
  })();
  
  // Store in-flight request
  inflightRequests.set(cacheKey, promise);
  return promise;
};

export const useGlobalDataProvider = () => {
  const { user } = useAuth();
  const { hasSubscription, loading: accessLoading } = useAccess();

  // Use React Query for global data with longer cache to reduce API calls
  const { data: globalData, isLoading, refetch } = useQuery({
    queryKey: ['globalData', user?.id],
    queryFn: () => fetchGlobalData(user!.id),
    enabled: !!user,
    staleTime: 300000, // 5 minutes - much longer to reduce REST calls
    refetchOnWindowFocus: false, // Disable to reduce unnecessary calls
    retry: 1 // Reduce retries
  });

  const state: GlobalDataState = {
    hasContacts: globalData?.hasContacts || false,
    hasSubscription: hasSubscription || false, // Get from useAccess to avoid duplicate calls
    challengeParticipant: globalData?.challengeParticipant || false,
    loading: isLoading || accessLoading
  };

  return {
    ...state,
    refetch: async () => {
      await refetch();
    },
    GlobalDataContext
  };
};