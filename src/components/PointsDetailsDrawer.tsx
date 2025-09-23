import React, { useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePointsDetails } from '@/hooks/usePointsDetails';
import { 
  TrendingUp, 
  MessageCircle, 
  Users, 
  Heart, 
  DollarSign, 
  Target,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PointsDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  contact_added: Users,
  contact_won: Target,
  contact_response: MessageCircle,
  networking_event: Users,
  community_post: MessageCircle,
  community_comment: MessageCircle,
  community_reaction: Heart,
  revenue_logged: DollarSign,
  outreach_activity: TrendingUp,
  daily_task_completed: CheckCircle,
  onboarding_task_completed: CheckCircle,
};

const ACTIVITY_LABELS: Record<string, string> = {
  contact_added: 'Contact Added',
  contact_won: 'Deal Won',
  contact_response: 'Response Received',
  networking_event: 'Networking Event',
  community_post: 'Community Post',
  community_comment: 'Community Comment',
  community_reaction: 'Community Reaction',
  revenue_logged: 'Revenue Logged',
  outreach_activity: 'Outreach Activity',
  daily_task_completed: 'Daily Task Completed',
  onboarding_task_completed: 'Onboarding Task Completed',
};

export function PointsDetailsDrawer({ open, onOpenChange }: PointsDetailsDrawerProps) {
  const { recentActivity, activityBreakdown, loading, loadDetails } = usePointsDetails();

  // Load details when drawer opens
  useEffect(() => {
    if (open && !recentActivity.length && !activityBreakdown.length) {
      loadDetails();
    }
  }, [open, recentActivity.length, activityBreakdown.length, loadDetails]);

  const getActivityIcon = (activityType: string) => {
    const Icon = ACTIVITY_ICONS[activityType] || Target;
    return <Icon className="h-4 w-4" />;
  };

  const getActivityLabel = (activityType: string) => {
    return ACTIVITY_LABELS[activityType] || activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Points Details
          </DrawerTitle>
          <DrawerDescription>
            Complete breakdown of your points and activities
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="px-4 pb-4">
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {/* Summary will be loaded from points summary hook separately */}
                      {recentActivity.reduce((sum, activity) => sum + activity.points_earned, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Recent Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {recentActivity.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Recent Activities</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Points by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : activityBreakdown.length > 0 ? (
                    activityBreakdown.map((activity) => (
                      <div
                        key={activity.activity_type}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getActivityIcon(activity.activity_type)}
                          <div>
                            <div className="font-medium">
                              {getActivityLabel(activity.activity_type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {activity.count} activities
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {activity.total_points} pts
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No activities yet. Start engaging to earn points!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="mt-1">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">
                                {activity.description || getActivityLabel(activity.activity_type)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), {
                                  addSuffix: true,
                                })}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              +{activity.points_earned}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity. Start engaging to see your points history!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}