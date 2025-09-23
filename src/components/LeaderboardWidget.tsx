import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Star, ArrowRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useChallenge } from "@/hooks/useChallenge";

const getRankIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="h-4 w-4 text-yellow-500" />;
    case 2: return <Medal className="h-4 w-4 text-gray-400" />;  
    case 3: return <Medal className="h-4 w-4 text-amber-600" />;
    default: return <Star className="h-4 w-4 text-muted-foreground" />;
  }
};

const getRankBadgeVariant = (position: number) => {
  switch (position) {
    case 1: return "default";
    case 2: return "secondary"; 
    case 3: return "outline";
    default: return "outline";
  }
};

export function LeaderboardWidget() {
  const { isChallengeParticipant } = useChallenge();
  const { leaderboard, loading } = useLeaderboard();

  // Only show for active challenge participants
  if (!isChallengeParticipant) {
    return null;
  }

  // Show top 5 users
  const topUsers = leaderboard.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Challenge Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-6 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Challenge Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No leaderboard data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Challenge Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topUsers.map((user) => (
            <div 
              key={user.user_id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge variant={getRankBadgeVariant(user.rank_position || 0)} className="min-w-[24px] h-6 flex items-center justify-center p-0">
                  {user.rank_position}
                </Badge>
                {getRankIcon(user.rank_position || 0)}
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {user.display_name || 'Anonymous'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.overall_progress.toFixed(0)}% • {user.total_days_completed} days completed
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-semibold text-primary">
                  {user.total_days_completed}
                </div>
                <div className="text-xs text-muted-foreground">
                  days
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.href = '/leaderboard'}
          >
            View Full Leaderboard
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}