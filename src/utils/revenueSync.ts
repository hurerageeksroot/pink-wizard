import { supabase } from '@/integrations/supabase/client';

export interface DailyRevenueData {
  day: number;
  totalRevenue: number;
  eventCount: number;
  lastUpdated: string;
}

export interface RevenueLoggedEvent {
  contactId: string;
  contactName: string;
  revenue: number;
  notes?: string;
  challengeDay: number;
  timestamp: string;
}

export interface ContactWonEvent {
  contactId: string;
  contactName: string;
  revenue: number;
  totalLifetimeValue: number;
  timestamp: string;
}

/**
 * Get daily revenue totals for the authenticated user
 */
export async function getDailyRevenueTotals(challengeDay?: number): Promise<DailyRevenueData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let query = supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_name', 'event_value');

    if (challengeDay) {
      query = query.eq('challenge_day', challengeDay);
    }

    const { data: revenueMetrics, error } = await query;
    
    if (error) {
      console.error('Error fetching revenue metrics:', error);
      return null;
    }

    const totalRevenue = revenueMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;
    
    // Get event count for the same period
    let eventQuery = supabase
      .from('user_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('metric_name', 'booked_events');

    if (challengeDay) {
      eventQuery = eventQuery.eq('challenge_day', challengeDay);
    }

    const { data: eventMetrics } = await eventQuery;
    const eventCount = eventMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;

    return {
      day: challengeDay || 0,
      totalRevenue,
      eventCount,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating daily revenue:', error);
    return null;
  }
}

/**
 * Send revenue event to parent app if embedded
 */
export function sendRevenueEventToParent(event: RevenueLoggedEvent | ContactWonEvent | DailyRevenueData, eventType: 'revenue_logged' | 'contact_won' | 'daily_revenue_update') {
  // Only send if we're in an iframe (embedded mode)
  if (window.parent === window) {
    console.log('[RevenueSync] Not in iframe, skipping parent message');
    return;
  }

  const messageType = `PINKWIZARD_${eventType.toUpperCase()}`;
  
  console.log(`[RevenueSync] Sending ${messageType} to parent:`, event);
  
  window.parent.postMessage({
    type: messageType,
    payload: event,
    timestamp: new Date().toISOString()
  }, '*');
}

/**
 * Get total lifetime revenue for a contact
 */
export async function getContactLifetimeValue(contactId: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: metrics, error } = await supabase
      .from('user_metrics')
      .select('value')
      .eq('user_id', user.id)
      .eq('metric_name', 'event_value')
      .eq('contact_id', contactId);

    if (error) {
      console.error('Error fetching contact lifetime value:', error);
      return 0;
    }

    return metrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;
  } catch (error) {
    console.error('Error calculating contact lifetime value:', error);
    return 0;
  }
}