import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PointsDetailsDrawer } from './PointsDetailsDrawer';
import { usePointsSummary } from '@/hooks/usePointsSummary';
import { TrendingUp, Award, Activity, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PointsCard() {
  const { pointsSummary, loading } = usePointsSummary();
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Points Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPoints = pointsSummary?.total_points || 0;
  const totalActivities = pointsSummary?.total_activities || 0;

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <CardHeader className="relative pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Points Summary
              {pointsSummary?.is_challenge_points && (
                <Badge variant="outline" className="text-xs ml-2">Challenge</Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              Details
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Points</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {totalPoints.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-secondary/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-4 w-4 text-secondary" />
                <span className="text-xs font-medium text-muted-foreground">Activities</span>
              </div>
              <div className="text-2xl font-bold text-secondary">
                {totalActivities}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-accent/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Activities</span>
              </div>
              <div className="text-xs font-semibold text-foreground">
                {totalActivities > 0 ? `${totalActivities} logged` : 'No activities yet'}
              </div>
            </div>
          </div>

          {totalPoints > 0 && (
            <div className="flex flex-wrap gap-1">
              {totalPoints >= 1000 && <Badge variant="secondary" className="text-xs px-2 py-0">1K+</Badge>}
              {totalPoints >= 5000 && <Badge variant="secondary" className="text-xs px-2 py-0">5K+</Badge>}
              {totalPoints >= 10000 && <Badge variant="outline" className="text-xs px-2 py-0">10K+</Badge>}
              {totalActivities >= 50 && <Badge variant="outline" className="text-xs px-2 py-0">Active</Badge>}
              {totalActivities >= 100 && <Badge variant="outline" className="text-xs px-2 py-0">Power User</Badge>}
            </div>
          )}
          
          {/* Performance Bonuses Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <h4 className="text-sm font-semibold text-primary mb-2">🎯 Performance Bonuses</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Weekly outreach bonus: 100 pts (500+ outreach points)</p>
              <p>• Weekly wins bonus: 150 pts (5+ wins: responses, meetings, deals)</p>
              <p>• Streak bonuses: 50-300 pts (7-30 day streaks)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PointsDetailsDrawer 
        open={showDetails} 
        onOpenChange={setShowDetails} 
      />
    </>
  );
}