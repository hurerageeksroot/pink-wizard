import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Activity, CheckCircle, Target, Award } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePointsSummary } from '@/hooks/usePointsSummary';
import { useBadges } from '@/hooks/useBadges';
import { useChallengeGoals } from '@/hooks/useChallengeGoals';
import { useAuth } from '@/contexts/AuthContext';

export function ChallengeSummaryCard() {
  const { user } = useAuth();
  const { pointsLeaderboard, loading: leaderboardLoading } = useLeaderboard();
  const { pointsSummary, loading: pointsLoading } = usePointsSummary();
  const { badges, loading: badgesLoading } = useBadges();
  const { goals } = useChallengeGoals();

  const loading = leaderboardLoading || pointsLoading || badgesLoading;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Challenge Complete
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

  // Find user's final rank
  const userRank = pointsLeaderboard.find(entry => entry.user_id === user?.id);
  const finalRank = userRank?.rank_position || null;
  const totalParticipants = pointsLeaderboard.length;

  const totalPoints = pointsSummary?.total_points || 0;
  const totalActivities = pointsSummary?.total_activities || 0;
  const badgesEarned = badges?.length || 0;

  // Check if goals were achieved
  const goalsAchieved = goals ? {
    leads: goals.leads_goal > 0 ? (goals.leads_progress || 0) >= goals.leads_goal : null,
    events: goals.events_goal > 0 ? (goals.events_progress || 0) >= goals.events_goal : null,
    revenue: goals.revenue_goal > 0 ? (goals.revenue_progress || 0) >= goals.revenue_goal : null,
  } : null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-primary/5" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Challenge Complete - Final Results 🏆
        </CardTitle>
        <CardDescription>
          75 Hard Mobile Bar Challenge • September 8 - November 22, 2025
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Final Rank Hero Stat */}
        {finalRank && (
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              {finalRank === 1 && <Trophy className="h-6 w-6 text-yellow-500" />}
              {finalRank === 2 && <Award className="h-6 w-6 text-gray-400" />}
              {finalRank === 3 && <Award className="h-6 w-6 text-amber-600" />}
              {finalRank > 3 && <Star className="h-6 w-6 text-primary" />}
            </div>
            <div className="text-3xl font-bold text-primary mb-1">
              #{finalRank}
            </div>
            <p className="text-sm text-muted-foreground">
              Final Rank (out of {totalParticipants} participants)
            </p>
          </div>
        )}

        {!finalRank && (
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Not ranked (privacy mode enabled)
            </p>
          </div>
        )}

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">
              {totalPoints.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Points</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-secondary/10 border border-secondary/20">
            <Activity className="h-5 w-5 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-secondary">
              {totalActivities}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Activities</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
            <Star className="h-5 w-5 text-accent-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold text-accent-foreground">
              {badgesEarned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Badges Earned</p>
          </div>
        </div>

        {/* Goals Achievement (if set) */}
        {goals && (goals.leads_goal > 0 || goals.events_goal > 0 || goals.revenue_goal > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Challenge Goals
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {goals.leads_goal > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Leads</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{goals.leads_progress}/{goals.leads_goal}</span>
                    {goalsAchieved?.leads && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
              )}
              {goals.events_goal > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Events</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{goals.events_progress}/{goals.events_goal}</span>
                    {goalsAchieved?.events && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
              )}
              {goals.revenue_goal > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Revenue</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">${goals.revenue_progress?.toLocaleString() || 0}/${goals.revenue_goal.toLocaleString()}</span>
                    {goalsAchieved?.revenue && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          Your achievements have been permanently saved. Thank you for participating!
        </div>
      </CardContent>
    </Card>
  );
}
