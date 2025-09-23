import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AccessState {
  hasAccess: boolean;
  reason: string;
  hasSubscription?: boolean;
  hasPayment?: boolean;
  hasTrial?: boolean;
  isChallengeParticipant?: boolean;
  trialEndDate?: string;
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
  const { data: accessData, isLoading, error, refetch } = useQuery({
    queryKey: ['access', user?.id],
    queryFn: () => checkAccessData(session),
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce frequent checks
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false, // Disable to prevent constant checks
    refetchOnMount: false, // Prevent remount checks
    refetchOnReconnect: true, // Only check on network reconnect
    retry: 1 // Reduce retries
  });

  const accessState: AccessState = {
    hasAccess: accessData?.hasAccess || false,
    reason: accessData?.reason || (error ? 'Error checking access' : 'Not authenticated'),
    hasSubscription: accessData?.hasSubscription || false,
    hasPayment: accessData?.hasPayment || false,
    hasTrial: accessData?.hasTrial || false,
    isChallengeParticipant: accessData?.isChallengeParticipant || false,
    trialEndDate: accessData?.trialEndDate || null,
    challengeEndDate: accessData?.challengeEndDate || null,
    userDetails: accessData?.user || null
  };

  const subscriptionState: SubscriptionState = {
    subscribed: accessData?.hasSubscription || false,
    subscription_tier: accessData?.subscription_tier || null,
    subscription_end: accessData?.subscription_end || null
  };

  const startTrial = async () => {
    if (!session?.access_token) return null;

    try {
      const { data, error } = await supabase.functions.invoke('start-trial', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      // Invalidate and refetch access data
      queryClient.invalidateQueries({ queryKey: ['access', user?.id] });
      
      return data;
    } catch (error) {
      console.error('Error starting trial:', error);
      return null;
    }
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

  const canWrite = accessState.hasAccess || subscriptionState.subscribed;

  return {
    ...accessState,
    ...subscriptionState,
    canWrite,
    loading: isLoading,
    checkAccess: refetch,
    startTrial,
    createCheckout,
    openCustomerPortal
  };
};