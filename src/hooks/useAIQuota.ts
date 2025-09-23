import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenge } from '@/hooks/useChallenge';

interface AIQuota {
  tier: string;
  monthly_quota: number;
  monthly_used: number;
  credits_remaining: number;
  per_request_limit: number;
  remaining: number;
  period_start: string;
  period_end: string;
}

interface TokenPack {
  starter: { tokens: number; price: number; name: string };
  growth: { tokens: number; price: number; name: string };
  enterprise: { tokens: number; price: number; name: string };
}

export function useAIQuota() {
  const [quota, setQuota] = useState<AIQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentUsage, setRecentUsage] = useState<any[]>([]);
  const { user } = useAuth();
  const { isChallengeParticipant } = useChallenge();

  const tokenPacks = {
    starter: { tokens: 15000, price: 999, name: 'Starter Pack' },
    growth: { tokens: 100000, price: 4999, name: 'Growth Pack' },
    enterprise: { tokens: 500000, price: 19999, name: 'Enterprise Pack' }
  };

  const fetchQuota = async (retryCount = 0) => {
    if (!user) {
      console.log('[AI Quota] No user found, skipping quota fetch');
      return;
    }
    
    console.log('[AI Quota] Starting quota fetch for user:', user.id, 'retry:', retryCount);
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch real AI quota data - handle both single object and array responses
      const { data: rawData, error: quotaError } = await supabase
        .rpc('get_my_ai_quota');

      console.log('[AI Quota] RPC response:', { data: rawData, error: quotaError });

      if (quotaError) {
        console.error('[AI Quota] RPC Error:', quotaError);
        
        // If RPC fails but user is a challenge participant, show unlimited quota
        if (isChallengeParticipant) {
          console.log('[AI Quota] RPC failed but user is challenge participant, using unlimited quota');
          const challengeQuota = {
            tier: 'Challenge Participant',
            monthly_quota: 999999999,
            monthly_used: 0,
            credits_remaining: 0,
            per_request_limit: 999999999,
            remaining: 999999999,
            period_start: new Date().toISOString().split('T')[0],
            period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
          };
          setQuota(challengeQuota);
          return; // Skip the error throw
        }
        
        // Retry once if it's a database error and this is the first attempt
        if (retryCount === 0 && quotaError.code) {
          console.log('[AI Quota] Retrying quota fetch after error');
          setTimeout(() => fetchQuota(1), 1000);
          return;
        }
        
        throw quotaError;
      }

      // Handle both array and single object responses from RPC
      let data: AIQuota | null = null;
      if (Array.isArray(rawData) && rawData.length > 0) {
        data = rawData[0] as AIQuota;
        console.log('[AI Quota] RPC returned array, using first item:', data);
      } else if (Array.isArray(rawData) && rawData.length === 0) {
        data = null;
        console.log('[AI Quota] RPC returned empty array');
      } else if (rawData && !Array.isArray(rawData)) {
        data = rawData as AIQuota;
        console.log('[AI Quota] RPC returned single object:', data);
      }

      // If no quota data is found, set default values for Free tier
      if (!data) {
        console.log('[AI Quota] No quota data found, using defaults');
        const defaultQuota = {
          tier: 'Free',
          monthly_quota: 10000,
          monthly_used: 0,
          credits_remaining: 0,
          per_request_limit: 1500,
          remaining: 10000,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
        };
        setQuota(defaultQuota);
      } else {
        console.log('[AI Quota] Setting quota data:', data);
        setQuota(data);
      }

      // Fetch recent usage data for breakdown
      const { data: recentUsageData, error: usageError } = await supabase
        .from('ai_requests_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!usageError && recentUsageData) {
        console.log('[AI Quota] Usage data loaded:', recentUsageData.length, 'records');
        setRecentUsage(recentUsageData);
      } else if (usageError) {
        console.warn('[AI Quota] Error fetching usage data:', usageError);
      }
      
      console.log('[AI Quota] Quota fetch completed successfully');
    } catch (err) {
      console.error('[AI Quota] Error fetching AI quota:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota';
      console.error('[AI Quota] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        stack: err instanceof Error ? err.stack : 'No stack',
        userId: user?.id
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const buyTokens = async (packType: keyof TokenPack) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('buy-ai-tokens', {
        body: { tokenPack: packType }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow) {
          // Fallback if popup blocked
          window.location.href = data.url;
        }
        
        // Poll for completion after a delay
        setTimeout(() => {
          const checkInterval = setInterval(async () => {
            try {
              const { data: sessionData } = await supabase.functions.invoke('verify-ai-purchase', {
                body: { session_id: data.session_id }
              });
              
              if (sessionData?.success) {
                clearInterval(checkInterval);
                fetchQuota(); // Refresh quota after successful purchase
              }
            } catch (error) {
              console.log('Checking purchase status...');
            }
          }, 3000);
          
          // Stop checking after 10 minutes
          setTimeout(() => clearInterval(checkInterval), 600000);
        }, 5000);
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
    }
  };

  const getUsagePercentage = () => {
    if (!quota) return 0;
    const total = quota.monthly_quota + quota.credits_remaining;
    const used = quota.monthly_used;
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  const getRemainingPercentage = () => {
    if (!quota) return 100;
    const total = quota.monthly_quota + quota.credits_remaining;
    return total > 0 ? Math.round((quota.remaining / total) * 100) : 0;
  };

  const formatTokens = (tokens: number) => {
    if (!tokens || tokens === 0) return '0';
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}k`;
    }
    return tokens.toString();
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'admin':
        return 'text-green-600';
      case 'challenge participant':
        return 'text-brand-coral';
      case 'free':
        return 'text-secondary-foreground';
      case 'basic':
        return 'text-secondary-foreground';
      case 'premium':
        return 'text-secondary-foreground';
      case 'enterprise':
        return 'text-secondary-foreground';
      default:
        return 'text-secondary-foreground';
    }
  };

  const estimateTokensFromInput = (text: string) => {
    // Rough estimation: 1 token ≈ 0.75 words for English text
    // Add overhead for system prompts and formatting
    const wordCount = text.trim().split(/\s+/).length;
    const baseTokens = Math.ceil(wordCount / 0.75);
    const systemPromptOverhead = 800; // Estimated tokens for system prompt
    const outputTokens = 300; // Estimated response tokens
    return baseTokens + systemPromptOverhead + outputTokens;
  };

  const getAverageTokenUsage = () => {
    if (!recentUsage.length) return null;
    const totalTokens = recentUsage.reduce((sum, usage) => sum + (usage.tokens_total || 0), 0);
    const avgTotal = Math.round(totalTokens / recentUsage.length);
    const avgPrompt = Math.round(recentUsage.reduce((sum, usage) => sum + (usage.tokens_prompt || 0), 0) / recentUsage.length);
    const avgCompletion = Math.round(recentUsage.reduce((sum, usage) => sum + (usage.tokens_completion || 0), 0) / recentUsage.length);
    
    return {
      total: avgTotal,
      prompt: avgPrompt,
      completion: avgCompletion,
      count: recentUsage.length
    };
  };

  const getTokenBreakdown = () => {
    const monthlyBreakdown = recentUsage.reduce((acc, usage) => {
      acc.totalPrompt += usage.tokens_prompt || 0;
      acc.totalCompletion += usage.tokens_completion || 0;
      acc.totalRequests += 1;
      return acc;
    }, { totalPrompt: 0, totalCompletion: 0, totalRequests: 0 });

    return {
      ...monthlyBreakdown,
      averagePerRequest: monthlyBreakdown.totalRequests > 0 ? 
        Math.round((monthlyBreakdown.totalPrompt + monthlyBreakdown.totalCompletion) / monthlyBreakdown.totalRequests) : 0
    };
  };

  const canMakeRequest = (estimatedTokens: number = 1500) => {
    if (!quota) return false;
    
    // Admin and Challenge Participants have unlimited quota
    if (quota.tier === 'Admin' || quota.tier === 'Challenge Participant') {
      return true;
    }
    
    const hasEnoughTokens = quota.remaining >= estimatedTokens;
    const withinRequestLimit = estimatedTokens <= quota.per_request_limit;
    return hasEnoughTokens && withinRequestLimit;
  };

  // Effect to refetch quota when challenge participant status changes
  useEffect(() => {
    if (user?.id && isChallengeParticipant !== undefined) {
      console.log('[AI Quota] Challenge participant status changed:', isChallengeParticipant);
      console.log('[AI Quota] Refetching quota due to participant status change');
      fetchQuota();
    }
  }, [user?.id, isChallengeParticipant]);

  // Effect to handle authentication changes
  useEffect(() => {
    if (user?.id) {
      console.log('[AI Quota] User authenticated, fetching quota for:', user.id);
      console.log('[AI Quota] Challenge participant status:', isChallengeParticipant);
      fetchQuota();
    } else {
      console.log('[AI Quota] No authenticated user, clearing quota state');
      setQuota(null);
      setError(null);
      setRecentUsage([]);
    }
  }, [user?.id]); // Only depend on user ID for auth changes

  // Auto-refresh removed to prevent excessive REST requests
  // Quota refreshes only on user actions or manual refresh

  const refreshQuota = () => {
    fetchQuota(0);
  };

  return {
    quota,
    loading,
    error,
    tokenPacks,
    recentUsage,
    fetchQuota: refreshQuota, // Provide wrapper for button handlers
    buyTokens,
    getUsagePercentage,
    getRemainingPercentage,
    formatTokens,
    getTierColor,
    canMakeRequest,
    estimateTokensFromInput,
    getAverageTokenUsage,
    getTokenBreakdown,
  };
}