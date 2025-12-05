import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RevenueEntry {
  id: string;
  amount: number;
  type: 'direct' | 'referral';
  notes?: string;
  date: Date;
  referredClient?: string;
}

export function useContactRevenue(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-revenue', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: metrics, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .eq('metric_name', 'event_value')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact revenue:', error);
        return [];
      }

      return (metrics || []).map(metric => ({
        id: metric.id,
        amount: metric.value || 0,
        type: (metric.notes?.includes('Referral') ? 'referral' : 'direct') as 'direct' | 'referral',
        notes: metric.notes,
        date: new Date(metric.created_at),
        referredClient: metric.notes?.match(/for client: (.+)/)?.[1]
      })) as RevenueEntry[];
    },
    enabled: !!contactId,
    staleTime: 0, // Always fetch fresh data
  });
}
