import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarDays, Users, Target, TrendingUp, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface NetworkingEvent {
  id: string;
  event_name: string;
  event_type: string;
  location?: string;
  event_date: string;
  contacts_met_count: number;
  follow_ups_scheduled: number;
  challenge_day: number;
  outreach_points: number;
  notes?: string;
  created_at: string;
}

interface NetworkingStats {
  totalEvents: number;
  totalContacts: number;
  totalFollowUps: number;
  totalPoints: number;
  thisMonthEvents: number;
  mostCommonEventType: string;
  recentEvent?: NetworkingEvent;
}

export const NetworkingAnalyticsWidget: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<NetworkingStats>({
    totalEvents: 0,
    totalContacts: 0,
    totalFollowUps: 0,
    totalPoints: 0,
    thisMonthEvents: 0,
    mostCommonEventType: "N/A"
  });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNetworkingStats();
    }
  }, [user]);

  const fetchNetworkingStats = async () => {
    if (!user) return;

    try {
      const { data: events, error } = await supabase
        .from('networking_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (events && events.length > 0) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Calculate stats
        const totalEvents = events.length;
        const totalContacts = events.reduce((sum, event) => sum + event.contacts_met_count, 0);
        const totalFollowUps = events.reduce((sum, event) => sum + event.follow_ups_scheduled, 0);
        const totalPoints = events.reduce((sum, event) => sum + event.outreach_points, 0);
        
        // This month's events
        const thisMonthEvents = events.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).length;

        // Most common event type
        const eventTypeCounts = events.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostCommonEventType = Object.keys(eventTypeCounts).length > 0
          ? Object.entries(eventTypeCounts).reduce((a, b) => eventTypeCounts[a[0]] > eventTypeCounts[b[0]] ? a : b)[0]
          : "N/A";

        setStats({
          totalEvents,
          totalContacts,
          totalFollowUps,
          totalPoints,
          thisMonthEvents,
          mostCommonEventType,
          recentEvent: events[0]
        });
      }
    } catch (error) {
      console.error('Error fetching networking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'conference': 'Conference',
      'meetup': 'Meetup',
      'workshop': 'Workshop',
      'seminar': 'Seminar',
      'networking': 'Networking',
      'trade_show': 'Trade Show',
      'webinar': 'Webinar',
      'general': 'General'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-primary/5 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Networking Analytics
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-primary/5 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Networking Analytics
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">{stats.totalEvents}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">{stats.totalContacts}</span>
                </div>
                <p className="text-xs text-muted-foreground">Contacts Met</p>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">{stats.totalFollowUps}</span>
                </div>
                <p className="text-xs text-muted-foreground">Follow-ups</p>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">{Math.round(stats.totalPoints)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{stats.thisMonthEvents} events</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Top Event Type</span>
                <Badge variant="secondary" className="text-xs">
                  {getEventTypeLabel(stats.mostCommonEventType)}
                </Badge>
              </div>

              {stats.recentEvent && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Latest Event</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {stats.recentEvent.event_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};