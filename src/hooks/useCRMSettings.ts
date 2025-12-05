import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CRMSettings, CRMCadences } from '@/types/crmSettings';
import { useToast } from '@/hooks/use-toast';

const defaultCadences: CRMCadences = {
  business_lead_statuses: {
    cold: { enabled: true, value: 1, unit: 'months' },
    warm: { enabled: true, value: 1, unit: 'weeks' },
    hot: { enabled: true, value: 3, unit: 'days' },
    won: { enabled: false },
    lost_not_fit: { enabled: false },
    lost_maybe_later: { enabled: true, value: 3, unit: 'months' },
  },
  business_nurture_statuses: {
    current_client: { enabled: true, value: 1, unit: 'weeks' },
    past_client: { enabled: true, value: 3, unit: 'months' },
    current_amplifier: { enabled: true, value: 2, unit: 'weeks' },
    strategic_partner: { enabled: true, value: 1, unit: 'months' },
  },
  personal_statuses: {
    friendly_not_close: { enabled: true, value: 3, unit: 'months' },
    outer_circle: { enabled: true, value: 2, unit: 'months' },
    close_circle: { enabled: true, value: 1, unit: 'months' },
    inner_circle: { enabled: true, value: 2, unit: 'weeks' },
    past_connection: { enabled: true, value: 6, unit: 'months' },
  },
  civic_statuses: {
    new: { enabled: true, value: 1, unit: 'weeks' },
    connected: { enabled: true, value: 1, unit: 'months' },
    trusted: { enabled: true, value: 2, unit: 'months' },
    unaligned: { enabled: false },
  },
  vendor_statuses: {
    potential: { enabled: true, value: 2, unit: 'weeks' },
    active: { enabled: true, value: 1, unit: 'months' },
    preferred: { enabled: true, value: 3, unit: 'months' },
  },
  fallback: { enabled: true, value: 2, unit: 'weeks' },
};

// Runtime migration helper to ensure intent-based cadences
function ensureIntentBasedCadences(cadences: any): CRMCadences {
  // Check if already using new intent-based structure
  if (cadences.business_lead_statuses) {
    // Ensure all intent groups exist with defaults for any missing statuses
    return {
      business_lead_statuses: { ...defaultCadences.business_lead_statuses, ...cadences.business_lead_statuses },
      business_nurture_statuses: { ...defaultCadences.business_nurture_statuses, ...cadences.business_nurture_statuses },
      personal_statuses: { ...defaultCadences.personal_statuses, ...cadences.personal_statuses },
      civic_statuses: { ...defaultCadences.civic_statuses, ...cadences.civic_statuses },
      vendor_statuses: { ...defaultCadences.vendor_statuses, ...cadences.vendor_statuses },
      fallback: cadences.fallback || defaultCadences.fallback,
    };
  }

  // Migrate old flat status structure to new intent-based structure
  if (cadences.status) {
    const oldStatus = cadences.status;
    return {
      business_lead_statuses: {
        cold: oldStatus.cold || defaultCadences.business_lead_statuses.cold,
        warm: oldStatus.warm || defaultCadences.business_lead_statuses.warm,
        hot: oldStatus.hot || defaultCadences.business_lead_statuses.hot,
        won: oldStatus.won || defaultCadences.business_lead_statuses.won,
        lost_not_fit: oldStatus.lost_not_fit || defaultCadences.business_lead_statuses.lost_not_fit,
        lost_maybe_later: oldStatus.lost_maybe_later || defaultCadences.business_lead_statuses.lost_maybe_later,
      },
      business_nurture_statuses: { ...defaultCadences.business_nurture_statuses },
      personal_statuses: { ...defaultCadences.personal_statuses },
      civic_statuses: {
        new: oldStatus.new || defaultCadences.civic_statuses.new,
        connected: defaultCadences.civic_statuses.connected,
        trusted: defaultCadences.civic_statuses.trusted,
        unaligned: defaultCadences.civic_statuses.unaligned,
      },
      vendor_statuses: { ...defaultCadences.vendor_statuses },
      fallback: cadences.fallback || defaultCadences.fallback,
    };
  }

  // Return full defaults if no recognizable structure
  return defaultCadences;
}

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
        cadences: ensureIntentBasedCadences(data.cadences),
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
        cadences: ensureIntentBasedCadences(newSettings.cadences),
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