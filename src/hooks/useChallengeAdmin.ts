import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChallengeConfig {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  current_day: number;
  is_active: boolean;
}

export const useChallengeAdmin = () => {
  const [challenges, setChallenges] = useState<ChallengeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id_param: user.id });
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenge_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async (challengeData: {
    name: string;
    start_date: string;
    end_date: string;
  }) => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      // Deactivate any existing active challenges first
      await supabase
        .from('challenge_config')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new challenge
      const { data, error } = await supabase
        .from('challenge_config')
        .insert([{
          ...challengeData,
          is_active: true,
          current_day: 1
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      
      // Refresh challenges list
      await fetchChallenges();
      
      return data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  };

  const endChallenge = async (challengeId: string) => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      const { error } = await supabase
        .from('challenge_config')
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', challengeId);

      if (error) throw error;
      
      // Refresh challenges list
      await fetchChallenges();
    } catch (error) {
      console.error('Error ending challenge:', error);
      throw error;
    }
  };

  const updateChallenge = async (challengeId: string, challengeData: {
    name?: string;
    start_date?: string;
    end_date?: string;
    total_days?: number;
  }) => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      // Trust database for total_days calculation
      const { error } = await supabase
        .from('challenge_config')
        .update(challengeData)
        .eq('id', challengeId);

      if (error) throw error;
      
      // Refresh challenges list
      await fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  };

  const updateChallengeDay = async (challengeId: string, day: number) => {
    if (!isAdmin) throw new Error('Admin access required');

    try {
      const { error } = await supabase
        .from('challenge_config')
        .update({ current_day: day })
        .eq('id', challengeId);

      if (error) throw error;
      
      // Refresh challenges list
      await fetchChallenges();
    } catch (error) {
      console.error('Error updating challenge day:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchChallenges();
    }
  }, [user]);

  return {
    challenges,
    loading,
    isAdmin,
    createChallenge,
    endChallenge,
    updateChallengeDay,
    updateChallenge,
    refetch: fetchChallenges
  };
};