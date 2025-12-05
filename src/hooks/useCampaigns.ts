import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  campaign_goal: string;
  offer_type?: 'campaign' | 'evergreen';
  event_date?: string;
  event_location?: string;
  deadline_date?: string;
  target_segments?: string[];
  target_relationship_types?: string[];
  value_proposition?: string;
  key_benefits?: string[];
  call_to_action?: string;
  tone?: string;
  urgency_level?: string;
  proof_points?: string[];
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  total_outreach: number;
  unique_contacts: number;
  channel_breakdown: { channel: string; count: number }[];
}

export interface CampaignOutreachLog {
  id: string;
  campaign_id: string;
  contact_id: string;
  user_id: string;
  generated_at: string;
  activity_id?: string;
  channel?: string;
  ai_tokens_used?: number;
  created_at: string;
  contact_name?: string;
  contact_email?: string;
}

export function useCampaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_initiatives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const { data: activeCampaigns } = useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_initiatives')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: Partial<Campaign>) => {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaign_initiatives')
        .insert([{ 
          ...campaignData,
          user_id: userData.user.id
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: "Campaign created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaign_initiatives')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: "Campaign updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_initiatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('campaign_initiatives')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({ title: "Campaign archived successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to archive campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    campaigns,
    activeCampaigns,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    archiveCampaign,
  };
}

export function useCampaignStats(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      // Get logged activities count (outreach that was actually logged as an activity)
      const { count: totalCount, error: countError } = await supabase
        .from('campaign_outreach_log')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .not('activity_id', 'is', null);

      if (countError) throw countError;

      // Get unique contacts count from logged activities
      const { data: activityData, error: activityError } = await supabase
        .from('campaign_outreach_log')
        .select('contact_id')
        .eq('campaign_id', campaignId)
        .not('activity_id', 'is', null);

      if (activityError) throw activityError;

      const uniqueContacts = new Set(activityData?.map(log => log.contact_id).filter(Boolean) || []).size;

      // Get channel breakdown from logged activities
      const { data: channelData, error: channelError } = await supabase
        .from('campaign_outreach_log')
        .select('channel, activity_id')
        .eq('campaign_id', campaignId)
        .not('activity_id', 'is', null);

      if (channelError) throw channelError;

      const channelBreakdown = channelData?.reduce((acc, log) => {
        const channel = log.channel || 'unknown';
        const existing = acc.find(item => item.channel === channel);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ channel, count: 1 });
        }
        return acc;
      }, [] as { channel: string; count: number }[]) || [];

      return {
        total_outreach: totalCount || 0,
        unique_contacts: uniqueContacts,
        channel_breakdown: channelBreakdown,
      } as CampaignStats;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignActivity(campaignId: string, limit: number = 20) {
  return useQuery({
    queryKey: ['campaign-activity', campaignId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_outreach_log')
        .select(`
          *,
          contacts!inner(name, email)
        `)
        .eq('campaign_id', campaignId)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(log => ({
        ...log,
        contact_name: (log.contacts as any)?.name,
        contact_email: (log.contacts as any)?.email,
      })) as CampaignOutreachLog[];
    },
    enabled: !!campaignId,
  });
}

export function useLogCampaignOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      contactId,
      channel,
      aiTokensUsed,
      activityId,
      contactSpecificGoal,
    }: {
      campaignId: string;
      contactId: string;
      channel?: string;
      aiTokensUsed?: number;
      activityId?: string;
      contactSpecificGoal?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaign_outreach_log')
        .insert({
          campaign_id: campaignId,
          contact_id: contactId,
          user_id: userData.user.id,
          channel,
          ai_tokens_used: aiTokensUsed,
          activity_id: activityId,
          contact_specific_goal: contactSpecificGoal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-activity', variables.campaignId] });
    },
  });
}
