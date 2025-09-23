import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_days_completed: number;
  current_streak: number;
  longest_streak: number;
  overall_progress: number;
  completion_rate: number;
  rank_position: number | null;
}

interface PointsLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  total_activities: number;
  rank_position: number;
}

interface RevenueLeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_revenue: number;
  contacts_count: number;
  rank_position: number;
}

type LeaderboardType = 'challenge' | 'points' | 'revenue';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pointsLeaderboard, setPointsLeaderboard] = useState<PointsLeaderboardEntry[]>([]);
  const [revenueLeaderboard, setRevenueLeaderboard] = useState<RevenueLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard data (only shows users who opted in)
      const { data, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .not('rank_position', 'is', null)
        .order('rank_position', { ascending: true })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const fetchPointsLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_points_leaderboard');
      if (error) throw error;
      setPointsLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching points leaderboard:', error);
      setPointsLeaderboard([]);
    }
  };

  const fetchRevenueLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_revenue_leaderboard');
      if (error) throw error;
      setRevenueLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching revenue leaderboard:', error);
      setRevenueLeaderboard([]);
    }
  };

  const fetchAllLeaderboards = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeaderboard(),
        fetchPointsLeaderboard(),
        fetchRevenueLeaderboard()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkOptInStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('show_in_leaderboard')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      // Note: Opt-in functionality removed - all users are automatically included
    } catch (error) {
      console.error('Error checking opt-in status:', error);
    }
  };

  const refreshLeaderboard = async () => {
    try {
      // Just refetch all data - let database triggers handle stats updates
      await fetchAllLeaderboards();
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchAllLeaderboards();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for leaderboard updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_stats'
        },
        () => {
          fetchAllLeaderboards();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points_ledger'
        },
        () => {
          // Debounce refresh on points changes
          setTimeout(fetchAllLeaderboards, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        () => {
          // Refresh when contacts are updated (for revenue tracking)
          setTimeout(fetchAllLeaderboards, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    leaderboard,
    pointsLeaderboard,
    revenueLeaderboard,
    loading,
    refreshLeaderboard,
    refetch: fetchAllLeaderboards
  };
};