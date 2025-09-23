import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CRMSettings, CRMCadences } from '@/types/crmSettings';
import { useToast } from '@/hooks/use-toast';

const defaultCadences: CRMCadences = {
  status: {
    cold: { enabled: true, value: 2, unit: 'weeks' },
    warm: { enabled: true, value: 3, unit: 'days' },
    hot: { enabled: true, value: 1, unit: 'days' },
    won: { enabled: false },
    lost_maybe_later: { enabled: true, value: 6, unit: 'months' },
    lost_not_fit: { enabled: false },
    none: { enabled: true, value: 1, unit: 'weeks' },
  },
  relationship: {
    lead: { enabled: true, value: 0, unit: 'days' }, // Today
    lead_amplifier: { enabled: true, value: 1, unit: 'weeks' }, // 1 week
    past_client: { enabled: true, value: 6, unit: 'months' },
    friend_family: { enabled: true, value: 12, unit: 'months' },
    associate_partner: { enabled: true, value: 3, unit: 'months' },
    referral_source: { enabled: true, value: 3, unit: 'months' },
    booked_client: { enabled: false, value: 1, unit: 'weeks' },
  },
  fallback: { enabled: true, value: 2, unit: 'weeks' },
};

const fetchCRMSettings = async (userId: string): Promise<CRMSettings> => {
  try {
    const { data, error } = await supabase
      .from('crm_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('CRM settings query error:', error);
      throw error;
    }

    if (data) {
      return {
        ...data,
        cadences: data.cadences as unknown as CRMCadences,
      };
    } else {
      // Create default settings
      const defaultSettings = {
        user_id: userId,
        auto_followup_enabled: true,
        cadences: defaultCadences as any,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('crm_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        console.error('CRM settings insert error:', insertError);
        throw insertError;
      }
      
      return {
        ...newSettings,
        cadences: newSettings.cadences as unknown as CRMCadences,
      };
    }
  } catch (error) {
    console.error('Error loading CRM settings:', error);
    // Return defaults on error
    return {
      id: '',
      user_id: userId,
      auto_followup_enabled: true,
      cadences: defaultCadences,
      created_at: '',
      updated_at: '',
    };
  }
};

export function useCRMSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: loading, refetch } = useQuery({
    queryKey: ['crmSettings', user?.id],
    queryFn: () => fetchCRMSettings(user!.id),
    enabled: !!user,
    staleTime: 300000, // 5 minutes - settings don't change often
    refetchOnWindowFocus: false,
    retry: 1
  });

  const saveSettings = async (updates: Partial<Pick<CRMSettings, 'auto_followup_enabled' | 'cadences'>>) => {
    if (!user || !settings) return;

    try {
      const { data, error } = await supabase
        .from('crm_settings')
        .update(updates as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update the cache
      const updatedSettings = {
        ...data,
        cadences: data.cadences as unknown as CRMCadences,
      };
      
      queryClient.setQueryData(['crmSettings', user.id], updatedSettings);
      
      toast({
        title: 'Settings saved',
        description: 'Your CRM settings have been updated',
      });
    } catch (error) {
      console.error('Error saving CRM settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return {
    settings: settings || {
      id: '',
      user_id: user?.id || '',
      auto_followup_enabled: true,
      cadences: defaultCadences,
      created_at: '',
      updated_at: '',
    },
    loading,
    saveSettings,
    reload: refetch,
  };
}