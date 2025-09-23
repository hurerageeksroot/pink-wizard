import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, CheckSquare, Clock, TrendingUp, Calendar, Mail, Phone, Linkedin, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

interface ActivityData {
  id: string;
  type: string;
  title: string;
  description?: string;
  response_received: boolean;
  scheduled_for?: string;
  completed_at?: string;
  created_at: string;
  contact_id: string;
}

interface ContactData {
  id: string;
  name: string;
}

interface ActivitiesStats {
  totalActivities: number;
  completedActivities: number;
  scheduledActivities: number;
  responsesReceived: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  mostCommonType: string;
  completionRate: number;
  responseRate: number;
  recentActivity?: ActivityData;
}

export const ActivitiesAnalyticsWidget: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivitiesStats>({
    totalActivities: 0,
    completedActivities: 0,
    scheduledActivities: 0,
    responsesReceived: 0,
    thisWeekActivities: 0,
    thisMonthActivities: 0,
    mostCommonType: "N/A",
    completionRate: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user && isExpanded) {
      fetchActivitiesStats();
    }
  }, [user, isExpanded]);

  const fetchActivitiesStats = async () => {
    if (!user) return;

    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (activities && activities.length > 0) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);

        // Calculate stats
        const totalActivities = activities.length;
        const completedActivities = activities.filter(activity => activity.completed_at).length;
        const scheduledActivities = activities.filter(activity => activity.scheduled_for && !activity.completed_at).length;
        const responsesReceived = activities.filter(activity => activity.response_received).length;
        
        // This week's activities
        const thisWeekActivities = activities.filter(activity => {
          const activityDate = new Date(activity.completed_at || activity.created_at);
          return activityDate >= weekStart && activityDate <= weekEnd;
        }).length;

        // This month's activities
        const thisMonthActivities = activities.filter(activity => {
          const activityDate = new Date(activity.completed_at || activity.created_at);
          return activityDate >= monthStart && activityDate <= monthEnd;
        }).length;

        // Most common activity type
        const activityTypeCounts = activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostCommonType = Object.keys(activityTypeCounts).length > 0
          ? Object.entries(activityTypeCounts).reduce((a, b) => activityTypeCounts[a[0]] > activityTypeCounts[b[0]] ? a : b)[0]
          : "N/A";

        // Calculate rates
        const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
        const responseRate = completedActivities > 0 ? Math.round((responsesReceived / completedActivities) * 100) : 0;

        setStats({
          totalActivities,
          completedActivities,
          scheduledActivities,
          responsesReceived,
          thisWeekActivities,
          thisMonthActivities,
          mostCommonType,
          completionRate,
          responseRate,
          recentActivity: activities[0]
        });
      }
    } catch (error) {
      console.error('Error fetching activities stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'email': 'Email',
      'call': 'Call',
      'linkedin': 'LinkedIn',
      'meeting': 'Meeting',
      'follow_up': 'Follow-up',
      'social': 'Social Media',
      'text': 'Text Message'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-accent" />
              Activities Analytics
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-accent" />
            Activities Analytics
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-accent">{stats.totalActivities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Activities</p>
            </div>
            
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-green-600">{stats.completedActivities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-orange-600">{stats.scheduledActivities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold text-blue-600">{stats.responsesReceived}</span>
              </div>
              <p className="text-xs text-muted-foreground">Responses</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="text-xl font-bold text-accent mb-1">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
            
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="text-xl font-bold text-accent mb-1">{stats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">Response Rate</p>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Week</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{stats.thisWeekActivities} activities</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{stats.thisMonthActivities} activities</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Most Common Type</span>
              <div className="flex items-center gap-1">
                {getActivityTypeIcon(stats.mostCommonType)}
                <Badge variant="secondary" className="text-xs">
                  {getActivityTypeLabel(stats.mostCommonType)}
                </Badge>
              </div>
            </div>

            {stats.recentActivity && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latest Activity</span>
                <div className="flex items-center gap-1">
                  {getActivityTypeIcon(stats.recentActivity.type)}
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {stats.recentActivity.title}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};