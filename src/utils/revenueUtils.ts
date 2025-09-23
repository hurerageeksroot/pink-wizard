import { supabase } from '@/integrations/supabase/client';

export async function getTotalRevenue(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_metrics')
      .select('value')
      .eq('user_id', userId)
      .eq('metric_name', 'event_value')
      .eq('metric_type', 'currency');

    if (error) throw error;

    return data?.reduce((total, metric) => total + (metric.value || 0), 0) || 0;
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return 0;
  }
}