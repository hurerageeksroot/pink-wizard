import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useChallengeStatus } from '@/hooks/useChallengeStatus';

interface ChallengeState {
  // Challenge status
  isActive: boolean;
  hasAccess: boolean;
  currentDay: number;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  
  // Participant status
  isChallengeParticipant: boolean;
}

// In-flight request deduplication for challenge progress
let inFlightProgressRequest: Promise<boolean> | null = null;

const fetchUserChallengeProgress = async (userId: string): Promise<boolean> => {
  // Return existing in-flight request if one exists
  if (inFlightProgressRequest) {
    console.log('🔄 [useChallenge] Reusing in-flight challenge progress request');
    return inFlightProgressRequest;
  }

  // Create new request and cache it
  inFlightProgressRequest = (async () => {
    try {
      console.log('🚀 [useChallenge] Making RPC call for user_is_challenge_participant');
      const { data, error } = await supabase
        .rpc('user_is_challenge_participant', { user_id_param: userId });

      if (error) {
        console.error('Error checking challenge participant status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      return false;
    } finally {
      // Clear the in-flight request once completed
      inFlightProgressRequest = null;
    }
  })();

  return inFlightProgressRequest;
};

export const useChallenge = () => {
  const { user } = useAuth();
  const { status: challengeStatus, loading: statusLoading } = useChallengeStatus();
  
  const { data: isChallengeParticipant, isLoading: participantLoading, refetch: refetchParticipant } = useQuery({
    queryKey: ['challengeParticipant', user?.id],
    queryFn: () => fetchUserChallengeProgress(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000, // Reduce to 30 seconds for faster updates
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: true, // Allow refetch on focus to pick up changes
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0 // Don't retry failed requests
  });

  const checkChallengeState = async (force = false) => {
    // Refetch the participant status from React Query
    if (force || !participant) {
      console.log('[useChallenge] Force refetching challenge participant status');
      await refetchParticipant();
    }
  };

  const loading = statusLoading || participantLoading;
  const participant = isChallengeParticipant || false;

  const state: ChallengeState = {
    isActive: challengeStatus.isActive,
    hasAccess: challengeStatus.hasAccess && participant, // Only participants have access
    currentDay: challengeStatus.currentDay,
    startDate: challengeStatus.startDate,
    endDate: challengeStatus.endDate,
    totalDays: challengeStatus.totalDays,
    isChallengeParticipant: participant
  };

  return {
    ...state,
    loading,
    refetch: checkChallengeState
  };
};