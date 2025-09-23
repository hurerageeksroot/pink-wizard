import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useChallengeParticipantCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('get_active_challenge_participant_count');
      
      if (error) throw error;
      
      setCount(data || 0);
    } catch (err) {
      console.error('Failed to fetch challenge participant count:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  return {
    count,
    loading,
    error,
    refetch: fetchCount
  };
};