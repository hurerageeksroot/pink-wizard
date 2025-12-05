import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ICP {
  id: string;
  user_id: string;
  target_industries: string[];
  target_job_titles: string[];
  target_company_sizes: string[];
  geographic_scope: 'local' | 'regional' | 'national' | 'international';
  target_locations: string[];
  key_characteristics?: string;
  generated_from_contacts: string[];
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  linkedin_url?: string;
  location?: string;
  source_url?: string;
  match_score: number;
  match_reasons: string[];
  status: 'new' | 'saved' | 'added_to_contacts' | 'dismissed';
  search_date: string;
  created_at: string;
}

export interface ProspectSearch {
  id: string;
  user_id: string;
  search_date: string;
  prospects_found: number;
  search_params: any;
  created_at: string;
}

export function useProspecting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch ICP
  const { data: icp, isLoading: icpLoading } = useQuery({
    queryKey: ['user_icp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_icp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ICP | null;
    },
    enabled: !!user,
  });

  // Fetch today's prospects
  const today = new Date().toISOString().split('T')[0];
  const { data: prospects, isLoading: prospectsLoading } = useQuery({
    queryKey: ['prospect_suggestions', user?.id, today],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('prospect_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_date', today)
        .order('match_score', { ascending: false });

      if (error) throw error;
      return data as Prospect[];
    },
    enabled: !!user,
  });

  // Check if user can search today
  const { data: todaySearch } = useQuery({
    queryKey: ['prospect_searches', user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('prospect_searches')
        .select('*')
        .eq('user_id', user.id)
        .eq('search_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProspectSearch | null;
    },
    enabled: !!user,
  });

  const canSearchToday = !todaySearch;

  // Run search mutation
  const runSearchMutation = useMutation({
    mutationFn: async (params?: { searchLocation?: string; searchRadius?: 'city' | 'metro' | 'state' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const response = await supabase.functions.invoke('generate-prospects', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: params || {},
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prospect_suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['prospect_searches'] });
      toast.success(`Found ${data.prospects_found} prospects!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to find prospects');
    },
  });

  // Update ICP mutation
  const updateICPMutation = useMutation({
    mutationFn: async (updates: Partial<ICP>) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('user_icp')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_icp'] });
      toast.success('ICP updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update ICP');
    },
  });

  // Update prospect status
  const updateProspectMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Prospect['status'] }) => {
      const { error } = await supabase
        .from('prospect_suggestions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_suggestions'] });
    },
  });

  // Add prospect to contacts
  const addToContactsMutation = useMutation({
    mutationFn: async (prospect: Prospect) => {
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: prospect.name,
          company: prospect.company,
          position: prospect.position,
          email: prospect.email,
          phone: prospect.phone,
          website_url: prospect.website_url,
          linkedin_url: prospect.linkedin_url,
          city: prospect.location?.split(',')[0]?.trim(),
          state: prospect.location?.split(',')[1]?.trim(),
          relationship_type: 'lead_client',
          status: 'cold',
          source: 'ai_prospecting',
          notes: `Found via AI prospecting. Match score: ${prospect.match_score}/100.\n\nWhy this is a good match:\n${prospect.match_reasons.join('\n')}\n\nSource: ${prospect.source_url || 'N/A'}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Update prospect status
      await supabase
        .from('prospect_suggestions')
        .update({ status: 'added_to_contacts' })
        .eq('id', prospect.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Added to contacts!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to contacts');
    },
  });

  return {
    icp,
    icpLoading,
    prospects: prospects || [],
    prospectsLoading,
    canSearchToday,
    runSearch: (params?: { searchLocation?: string; searchRadius?: 'city' | 'metro' | 'state' }) => 
      runSearchMutation.mutate(params),
    isSearching: runSearchMutation.isPending,
    updateICP: updateICPMutation.mutate,
    saveProspect: (id: string) => updateProspectMutation.mutate({ id, status: 'saved' }),
    dismissProspect: (id: string) => updateProspectMutation.mutate({ id, status: 'dismissed' }),
    addToContacts: addToContactsMutation.mutate,
  };
}