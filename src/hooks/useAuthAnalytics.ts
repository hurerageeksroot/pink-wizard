import { useState, useEffect } from 'react';

interface AuthStats {
  success_count: number;
  error_count: number;
  total_requests: number;
  error_rate: number;
  errors_4xx: number;
  errors_5xx: number;
  recent_errors: Array<{
    timestamp: string;
    path: string;
    status: number;
    msg: string;
  }>;
}

export const useAuthAnalytics = () => {
  const [authStats, setAuthStats] = useState<AuthStats>({
    success_count: 0,
    error_count: 0,
    total_requests: 0,
    error_rate: 0,
    errors_4xx: 0,
    errors_5xx: 0,
    recent_errors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock data for now since analytics queries need special handling
      // In a real implementation, this would query Supabase analytics
      const mockStats = {
        success_count: 1247,
        error_count: 3,
        total_requests: 1250,
        error_rate: 0.24,
        errors_4xx: 2,
        errors_5xx: 1,
        recent_errors: [
          {
            timestamp: new Date().toISOString(),
            path: '/auth/token',
            status: 401,
            msg: 'Invalid refresh token'
          }
        ]
      };

      setAuthStats(mockStats);

    } catch (err) {
      console.error('Error fetching auth analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch auth analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStats();
  }, []);

  return {
    authStats,
    loading,
    error,
    refreshAuthStats: fetchAuthStats
  };
};