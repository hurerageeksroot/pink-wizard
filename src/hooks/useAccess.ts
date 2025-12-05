import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AccessState {
  hasAccess: boolean;
  reason: string;
  hasSubscription?: boolean;
  hasPayment?: boolean;
  isChallengeParticipant?: boolean;
  challengeEndDate?: string;
  userDetails?: any;
}

interface SubscriptionState {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

const checkAccessData = async (session: any) => {
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  
  const { data, error } = await supabase.functions.invoke('check-access', {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) {
    throw new Error('Error checking access');
  }

  return data;
};

export const useAccess = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Single cached query for access data - optimized for performance
  // Phase 6: Reduced staleTime to 30 seconds to prevent stale JWT issues
  const { data: accessData, isLoading, error, refetch } = useQuery({
    queryKey: ['access', user?.id],
    queryFn: () => checkAccessData(session),
    enabled: !!user && !!session?.access_token,
    staleTime: 30 * 1000, // 30 seconds - shorter for critical operations
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false, // Disable to prevent constant checks
    refetchOnMount: false, // Prevent remount checks
    refetchOnReconnect: true, // Only check on network reconnect
    retry: 1 // Reduce retries
  });

  // Manual session refresh function for recovery scenarios
  const refreshSession = async () => {
    try {
      console.log('[useAccess] Refreshing session manually');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[useAccess] Session refresh failed:', error);
        return false;
      }
      
      console.log('[useAccess] Session refreshed successfully');
      // Invalidate access query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ['access', user?.id] });
      return true;
    } catch (err) {
      console.error('[useAccess] Session refresh error:', err);
      return false;
    }
  };

  // UNIVERSAL ACCESS MODE: All authenticated users have write access
  // Simplified for early-stage application (45 users)
  const accessState: AccessState = {
    hasAccess: accessData?.hasAccess || false,
    reason: accessData?.reason || (error ? 'Error checking access' : 'Not authenticated'),
    hasSubscription: false, // Not tracking subscriptions
    hasPayment: false, // Not tracking payments
    isChallengeParticipant: accessData?.isChallengeParticipant || false,
    challengeEndDate: null,
    userDetails: accessData?.user || null
  };

  const subscriptionState: SubscriptionState = {
    subscribed: false, // Not tracking subscriptions
    subscription_tier: null,
    subscription_end: null
  };

  const createCheckout = async () => {
    if (!session?.access_token) return null;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) return null;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      return null;
    }
  };

  // UNIVERSAL ACCESS: All authenticated users can write
  const canWrite = accessState.hasAccess;

  return {
    ...accessState,
    ...subscriptionState,
    canWrite,
    loading: isLoading,
    checkAccess: refetch,
    refreshSession,
    createCheckout,
    openCustomerPortal
  };
};