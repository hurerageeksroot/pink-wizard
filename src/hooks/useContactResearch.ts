import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ContactResearch {
  id: string;
  user_id: string;
  contact_id: string;
  research_data: {
    bio: string;
    keyFacts: string[];
    icebreakers: string[];
    outreachAngles: string[];
    sources: Array<{
      url: string;
      content: string;
      timestamp: string;
    }>;
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useContactResearch = (contactId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStartingResearch, setIsStartingResearch] = useState(false);

  // Fetch existing research data
  const { data: research, isLoading, error } = useQuery({
    queryKey: ['contact-research', contactId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('contact_research')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contact research:', error);
        throw new Error('Failed to load research data');
      }

      return data as ContactResearch | null;
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Start research process
  const startResearch = async () => {
    if (!user || !contactId) {
      throw new Error('User not authenticated or contact ID missing');
    }

    setIsStartingResearch(true);
    
    try {
      // Get the current session to use as authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the research edge function
      const response = await supabase.functions.invoke('research-contact', {
        body: { contactId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Research function error:', response.error);
        throw new Error(response.error.message || 'Research failed');
      }

      // Invalidate and refetch the query
      await queryClient.invalidateQueries({ queryKey: ['contact-research', contactId] });
      
      return response.data;
    } catch (error) {
      console.error('Error starting research:', error);
      throw error;
    } finally {
      setIsStartingResearch(false);
    }
  };

  // Set up real-time subscription for research updates
  useEffect(() => {
    if (!user || !contactId) return;

    const channel = supabase
      .channel(`contact_research_${contactId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_research',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          console.log('Research update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['contact-research', contactId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, contactId, queryClient]);

  return {
    research,
    isLoading,
    error,
    isStartingResearch,
    startResearch,
  };
};