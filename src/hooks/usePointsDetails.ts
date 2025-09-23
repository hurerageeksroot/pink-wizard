import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PointsEntry {
  id: string;
  activity_type: string;
  points_earned: number;
  description: string | null;
  metadata: any;
  challenge_day: number | null;
  created_at: string;
}

interface ActivityBreakdown {
  activity_type: string;
  total_points: number;
  count: number;
}

const fetchRecentActivity = async (userId: string): Promise<PointsEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('user_points_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

const fetchActivityBreakdown = async (userId: string): Promise<ActivityBreakdown[]> => {
  try {
    const { data, error } = await supabase
      .from('user_points_ledger')
      .select('activity_type, points_earned')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching activity breakdown:', error);
      return [];
    }

    // Aggregate by activity type
    const breakdown = data.reduce((acc: Record<string, ActivityBreakdown>, entry) => {
      if (!acc[entry.activity_type]) {
        acc[entry.activity_type] = {
          activity_type: entry.activity_type,
          total_points: 0,
          count: 0
        };
      }
      acc[entry.activity_type].total_points += entry.points_earned;
      acc[entry.activity_type].count += 1;
      return acc;
    }, {});

    return Object.values(breakdown).sort((a, b) => b.total_points - a.total_points);
  } catch (error) {
    console.error('Error fetching activity breakdown:', error);
    return [];
  }
};

export function usePointsDetails() {
  const { user } = useAuth();

  const { data: recentActivity, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['pointsRecentActivity', user?.id],
    queryFn: () => fetchRecentActivity(user!.id),
    enabled: false, // Only fetch when explicitly requested
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const { data: activityBreakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useQuery({
    queryKey: ['pointsActivityBreakdown', user?.id],
    queryFn: () => fetchActivityBreakdown(user!.id),
    enabled: false, // Only fetch when explicitly requested
    staleTime: 60000, // Longer stale time for breakdown
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Listen for real-time updates when details are being viewed
  useEffect(() => {
    if (!user || (!recentActivity && !activityBreakdown)) return;

    const channel = supabase
      .channel('points-details-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_points_ledger',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New points earned, refreshing details:', payload);
          // Refresh both recent activity and breakdown
          refetchRecent();
          refetchBreakdown();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recentActivity, activityBreakdown, refetchRecent, refetchBreakdown]);

  const loadDetails = async () => {
    await Promise.all([refetchRecent(), refetchBreakdown()]);
  };

  return {
    recentActivity: recentActivity || [],
    activityBreakdown: activityBreakdown || [],
    loading: recentLoading || breakdownLoading,
    loadDetails
  };
}