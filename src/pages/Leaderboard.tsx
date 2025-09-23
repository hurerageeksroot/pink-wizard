import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Zap, Target, TrendingUp, RefreshCw, Info, CheckCircle, Calendar, BarChart3, ChevronDown, ChevronRight, DollarSign, Star } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useChallenge } from '@/hooks/useChallenge';
import { useChallengeAdmin } from '@/hooks/useChallengeAdmin';
import { useChallengeStatus } from '@/hooks/useChallengeStatus';
import { useAuth } from '@/contexts/AuthContext';
import TodaysCompletions from '@/components/TodaysCompletions';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdminChallengeControls } from '@/components/AdminChallengeControls';

const getRankIcon = (position: number) => {
  switch (position) {
    case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
    case 3: return <Medal className="h-5 w-5 text-amber-600" />;
    default: return <Award className="h-4 w-4 text-muted-foreground" />;
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

export default function Leaderboard() {
  const { user } = useAuth();
  const { isChallengeParticipant } = useChallenge();
  const { leaderboard, pointsLeaderboard, revenueLeaderboard, loading, refreshLeaderboard } = useLeaderboard();
  const { isAdmin } = useChallengeAdmin();
  const { status: challengeStatus } = useChallengeStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [rankingExplanationOpen, setRankingExplanationOpen] = useState(false);

  // Check for ties in first place - compare actual scores/progress, not just rank_position
  const getTopScore = (board: any[]) => board.length > 0 ? board[0] : null;
  
  const challengeFirstPlaceTied = leaderboard.length > 1 && (() => {
    const topScore = getTopScore(leaderboard);
    if (!topScore) return false;
    
    // Count how many people have the same score as the leader
    const tiedCount = leaderboard.filter(entry => 
      entry.total_days_completed === topScore.total_days_completed &&
      Math.round(entry.overall_progress * 10) === Math.round(topScore.overall_progress * 10)
    ).length;
    
    return tiedCount > 1;
  })();
  
  const pointsFirstPlaceTied = pointsLeaderboard.length > 1 && (() => {
    const topScore = getTopScore(pointsLeaderboard);
    if (!topScore) return false;
    
    const tiedCount = pointsLeaderboard.filter(entry => 
      entry.total_points === topScore.total_points
    ).length;
    
    return tiedCount > 1;
  })();
  
  const revenueFirstPlaceTied = revenueLeaderboard.length > 1 && (() => {
    const topScore = getTopScore(revenueLeaderboard);
    if (!topScore) return false;
    
    const tiedCount = revenueLeaderboard.filter(entry => 
      entry.total_revenue === topScore.total_revenue
    ).length;
    
    return tiedCount > 1;
  })();


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLeaderboard();
      toast.success('Leaderboard updated!');
    } catch (error) {
      toast.error('Failed to refresh leaderboard');
    } finally {
      setRefreshing(false);
    }
  };

  const currentUserRank = leaderboard.find(entry => entry.user_id === user?.id);
  const currentUserPointsRank = pointsLeaderboard.find(entry => entry.user_id === user?.id);
  const currentUserRevenueRank = revenueLeaderboard.find(entry => entry.user_id === user?.id);

  // Single source of truth: only challenge participants can see leaderboards
  if (!isChallengeParticipant && !isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="text-center py-12">
          <CardHeader>
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Challenge Leaderboards</CardTitle>
            <CardDescription className="text-base">
              Leaderboards are only available to active challenge participants.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Challenge Leaderboard</h1>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Challenge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-coral mb-1">
              {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : challengeStatus.totalDays}
            </div>
            <p className="text-sm text-muted-foreground">Total Days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-coral mb-1">
              {challengeStatus.currentDay}
            </div>
            <p className="text-sm text-muted-foreground">Current Day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-coral mb-1">
              <TodaysCompletions />
            </div>
            <p className="text-sm text-muted-foreground">Today's Full Completions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-coral mb-1">
              {leaderboard.length}
            </div>
            <p className="text-sm text-muted-foreground">Active Participants</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-coral mb-1">
              {challengeStatus.endDate ? new Date(challengeStatus.endDate).toLocaleDateString() : 'TBD'}
            </div>
            <p className="text-sm text-muted-foreground">End Date</p>
          </CardContent>
        </Card>
      </div>


      {/* Ranking Explanation */}
      <Collapsible 
        open={rankingExplanationOpen} 
        onOpenChange={setRankingExplanationOpen}
        className="mb-6"
      >
        <Card className="border-blue-200 bg-blue-50/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-blue-50/40 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  How Rankings Are Calculated
                </div>
                {rankingExplanationOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
              <CardDescription>
                Understand the transparent formula behind leaderboard positions
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="text-sm">
                <p className="font-medium mb-4">We have three different leaderboard rankings, each with their own criteria:</p>
                
                {/* Challenge Progress Rankings */}
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Challenge Progress Rankings
                    </h4>
                    <p className="text-muted-foreground text-xs mb-3">Ranked by challenge completion criteria (in order of priority):</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">1</div>
                        <div>
                           <div className="flex items-center gap-2 font-medium">
                             <Calendar className="h-4 w-4" />
                             Total Days Completed
                           </div>
                           <p className="text-muted-foreground text-xs">Number of challenge days where ALL daily tasks were completed (100% for that day)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">2</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <BarChart3 className="h-4 w-4" />
                            Overall Progress
                          </div>
                          <p className="text-muted-foreground text-xs">Percentage across ALL activities: onboarding tasks, daily tasks, weekly goals, and project goals</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">3</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <TrendingUp className="h-4 w-4" />
                            Completion Rate
                          </div>
                          <p className="text-muted-foreground text-xs">Percentage of total challenge days completed (days completed ÷ 75 total days)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Rankings */}
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Points Rankings
                    </h4>
                    <p className="text-muted-foreground text-xs mb-3">Simple ranking by total points earned:</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex-shrink-0">1</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Star className="h-4 w-4" />
                            Total Points Earned
                          </div>
                          <p className="text-muted-foreground text-xs">Sum of all points from activities, achievements, and milestones</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex-shrink-0">2</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Target className="h-4 w-4" />
                            Total Activities
                          </div>
                          <p className="text-muted-foreground text-xs">Total number of point-earning activities completed (tiebreaker)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Rankings */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue Rankings
                    </h4>
                    <p className="text-muted-foreground text-xs mb-3">Ranked by business results (in order of priority):</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">1</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <DollarSign className="h-4 w-4" />
                            Total Revenue
                          </div>
                          <p className="text-muted-foreground text-xs">Sum of all revenue from contacts marked as "won"</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">2</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Trophy className="h-4 w-4" />
                            Won Deals
                          </div>
                          <p className="text-muted-foreground text-xs">Total number of deals successfully closed (tiebreaker)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">3</div>
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Target className="h-4 w-4" />
                            Total Contacts
                          </div>
                          <p className="text-muted-foreground text-xs">Total number of contacts in pipeline (final tiebreaker)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>How it works:</strong> Each leaderboard uses its own ranking system. Challenge Progress focuses on consistency and completion, 
                    Points rewards activity and engagement, and Revenue tracks business results. You can compete in all three areas simultaneously!
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>About Tied Ranks:</strong> When multiple participants have identical scores, they share the same rank. The next rank continues sequentially (e.g., if 3 people tie for 1st place, the next person ranks 2nd, not 4th).
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Current User Position */}
      {(currentUserRank || currentUserPointsRank || currentUserRevenueRank) && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentUserRank && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(currentUserRank.rank_position || 0)}
                      <Badge variant={getRankBadgeVariant(currentUserRank.rank_position || 0)}>
                        #{currentUserRank.rank_position}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Challenge Progress</p>
                      <div className="text-sm text-muted-foreground">
                        {currentUserRank.total_days_completed} days completed • {currentUserRank.overall_progress.toFixed(1)}% progress
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{currentUserRank.overall_progress.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                </div>
              )}

              {currentUserPointsRank && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(currentUserPointsRank.rank_position || 0)}
                      <Badge variant={getRankBadgeVariant(currentUserPointsRank.rank_position || 0)}>
                        #{currentUserPointsRank.rank_position}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Points</p>
                      <div className="text-sm text-muted-foreground">
                        {currentUserPointsRank.total_activities} activities completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{currentUserPointsRank.total_points.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                  </div>
                </div>
              )}

              {currentUserRevenueRank && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(currentUserRevenueRank.rank_position || 0)}
                      <Badge variant={getRankBadgeVariant(currentUserRevenueRank.rank_position || 0)}>
                        #{currentUserRevenueRank.rank_position}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">Revenue</p>
                      <div className="text-sm text-muted-foreground">
                        {currentUserRevenueRank.contacts_count} contacts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${Number(currentUserRevenueRank.total_revenue).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Top Challenge Leader */}
        <Card className="border-primary/20 bg-gradient-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-primary-foreground">
              <Target className="h-5 w-5" />
              Challenge Champion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {loading ? (
              <div className="py-8">
                <Target className="h-12 w-12 text-primary-foreground/60 mx-auto mb-2 animate-pulse" />
                <p className="text-primary-foreground/80">Loading...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8">
                <Target className="h-12 w-12 text-primary-foreground/60 mx-auto mb-2" />
                <p className="text-primary-foreground/80">No challenge leaders yet</p>
              </div>
            ) : challengeFirstPlaceTied ? (
              <div className="py-8">
                <div className="flex justify-center items-center gap-1 mb-3">
                  <Crown className="h-8 w-8 text-primary-foreground" />
                  <Crown className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg text-primary-foreground mb-2">
                  Multiple Champions Tied
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  {leaderboard.filter(entry => {
                    const topScore = leaderboard[0];
                    return entry.total_days_completed === topScore.total_days_completed &&
                           Math.round(entry.overall_progress * 10) === Math.round(topScore.overall_progress * 10) &&
                           entry.current_streak === topScore.current_streak &&
                           entry.longest_streak === topScore.longest_streak;
                  }).length} participants tied for 1st place
                </p>
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary-foreground mt-2">
                  <CheckCircle className="h-5 w-5" />
                  {Math.round(leaderboard[0].overall_progress)}%
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Avatar className="h-16 w-16 mx-auto border-4 border-primary-foreground/20">
                  <AvatarImage src={leaderboard[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-xl font-bold">
                    {leaderboard[0].display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg text-primary-foreground">
                    {leaderboard[0].display_name || 'Anonymous User'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary-foreground">
                    <CheckCircle className="h-6 w-6" />
                    {Math.round(leaderboard[0].overall_progress)}%
                  </div>
                  <p className="text-sm text-primary-foreground/80">
                    {leaderboard[0].total_days_completed} days • {leaderboard[0].current_streak} streak
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Points Leader */}
        <Card className="border-accent/20 bg-gradient-accent">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-accent-foreground">
              <Crown className="h-5 w-5" />
              Points Champion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {loading ? (
              <div className="py-8">
                <Star className="h-12 w-12 text-accent-foreground/60 mx-auto mb-2 animate-pulse" />
                <p className="text-accent-foreground/80">Loading...</p>
              </div>
            ) : pointsLeaderboard.length === 0 ? (
              <div className="py-8">
                <Star className="h-12 w-12 text-accent-foreground/60 mx-auto mb-2" />
                <p className="text-accent-foreground/80">No points leaders yet</p>
              </div>
            ) : pointsFirstPlaceTied ? (
              <div className="py-8">
                <div className="flex justify-center items-center gap-1 mb-3">
                  <Crown className="h-8 w-8 text-accent-foreground" />
                  <Crown className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-lg text-accent-foreground mb-2">
                  Multiple Champions Tied
                </h3>
                <p className="text-sm text-accent-foreground/80">
                  {pointsLeaderboard.filter(entry => entry.total_points === pointsLeaderboard[0].total_points).length} participants tied for 1st place
                </p>
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-accent-foreground mt-2">
                  <Star className="h-5 w-5" />
                  {pointsLeaderboard[0].total_points.toLocaleString()} pts
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Avatar className="h-16 w-16 mx-auto border-4 border-accent-foreground/20">
                  <AvatarImage src={pointsLeaderboard[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-accent-foreground/10 text-accent-foreground text-xl font-bold">
                    {pointsLeaderboard[0].display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg text-accent-foreground">
                    {pointsLeaderboard[0].display_name || 'Anonymous User'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-accent-foreground">
                    <Star className="h-6 w-6" />
                    {pointsLeaderboard[0].total_points.toLocaleString()} pts
                  </div>
                  <p className="text-sm text-accent-foreground/80">
                    {pointsLeaderboard[0].total_activities} activities completed
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Revenue Leader */}
        <Card className="border-secondary/20 bg-gradient-secondary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-secondary-foreground">
              <Trophy className="h-5 w-5" />
              Revenue Champion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {loading ? (
              <div className="py-8">
                <DollarSign className="h-12 w-12 text-secondary-foreground/60 mx-auto mb-2 animate-pulse" />
                <p className="text-secondary-foreground/80">Loading...</p>
              </div>
            ) : revenueLeaderboard.length === 0 ? (
              <div className="py-8">
                <DollarSign className="h-12 w-12 text-secondary-foreground/60 mx-auto mb-2" />
                <p className="text-secondary-foreground/80">No revenue leaders yet</p>
              </div>
            ) : revenueFirstPlaceTied ? (
              <div className="py-8">
                <div className="flex justify-center items-center gap-1 mb-3">
                  <Crown className="h-8 w-8 text-secondary-foreground" />
                  <Crown className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="font-bold text-lg text-secondary-foreground mb-2">
                  Multiple Champions Tied
                </h3>
                <p className="text-sm text-secondary-foreground/80">
                  {revenueLeaderboard.filter(entry => entry.total_revenue === revenueLeaderboard[0].total_revenue).length} participants tied for 1st place
                </p>
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-secondary-foreground mt-2">
                  <DollarSign className="h-5 w-5" />
                  ${Number(revenueLeaderboard[0].total_revenue).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Avatar className="h-16 w-16 mx-auto border-4 border-secondary-foreground/20">
                  <AvatarImage src={revenueLeaderboard[0].avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary-foreground/10 text-secondary-foreground text-xl font-bold">
                    {revenueLeaderboard[0].display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg text-secondary-foreground">
                    {revenueLeaderboard[0].display_name || 'Anonymous User'}
                  </h3>
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-secondary-foreground">
                    <DollarSign className="h-6 w-6" />
                    ${Number(revenueLeaderboard[0].total_revenue).toLocaleString()}
                  </div>
                  <p className="text-sm text-secondary-foreground/80">
                    {revenueLeaderboard[0].contacts_count} contacts
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="challenge" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="challenge">Challenge Progress</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="challenge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Rankings
              </CardTitle>
              <CardDescription>
                Top performers in the current challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded" />
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-muted rounded mb-2" />
                        <div className="w-48 h-3 bg-muted rounded" />
                      </div>
                      <div className="w-16 h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to complete challenge tasks and appear on the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => {
                    // Calculate dense rank - count unique scores ahead of current entry
                    let currentRank = 1;
                    const currentScore = {
                      days: entry.total_days_completed,
                      progress: Math.round(entry.overall_progress * 10)
                    };
                    
                    // Track unique scores we've seen that are better than current
                    const uniqueScoresAhead = new Set<string>();
                    
                    for (let i = 0; i < index; i++) {
                      const prevScore = {
                        days: leaderboard[i].total_days_completed,
                        progress: Math.round(leaderboard[i].overall_progress * 10)
                      };
                      const scoreKey = `${prevScore.days}-${prevScore.progress}`;
                      
                      // Only count if this score is better than current
                      if (prevScore.days > currentScore.days || 
                          (prevScore.days === currentScore.days && prevScore.progress > currentScore.progress)) {
                        uniqueScoresAhead.add(scoreKey);
                      }
                    }
                    
                    currentRank = uniqueScoresAhead.size + 1;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          entry.user_id === user?.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-12">
                          {getRankIcon(currentRank)}
                          <Badge variant={getRankBadgeVariant(currentRank)}>
                            #{currentRank}
                          </Badge>
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.display_name || 'Anonymous User'}
                            {entry.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {entry.total_days_completed} days
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {entry.current_streak} streak
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {entry.completion_rate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {entry.overall_progress.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-6 w-6" />
                Points Rankings
              </CardTitle>
              <CardDescription>
                Top performers by total points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded" />
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-muted rounded mb-2" />
                        <div className="w-48 h-3 bg-muted rounded" />
                      </div>
                      <div className="w-16 h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : pointsLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No points yet</h3>
                  <p className="text-muted-foreground">
                    Start completing activities to appear on the points leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pointsLeaderboard.map((entry, index) => {
                    // Use database rank_position which already implements dense ranking
                    const currentRank = entry.rank_position;
                    
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          entry.user_id === user?.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-12">
                          {getRankIcon(currentRank)}
                          <Badge variant={getRankBadgeVariant(currentRank)}>
                            #{currentRank}
                          </Badge>
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.display_name || 'Anonymous User'}
                            {entry.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {entry.total_activities} activities
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {entry.total_points.toLocaleString()} pts
                          </p>
                          <p className="text-xs text-muted-foreground">Total Points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Revenue Rankings
              </CardTitle>
              <CardDescription>
                Top performers by total revenue booked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                      <div className="w-8 h-8 bg-muted rounded" />
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-muted rounded mb-2" />
                        <div className="w-48 h-3 bg-muted rounded" />
                      </div>
                      <div className="w-16 h-4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : revenueLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No revenue tracked yet</h3>
                  <p className="text-muted-foreground">
                    Start winning deals to appear on the revenue leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {revenueLeaderboard.map((entry, index) => {
                    // Use database rank_position which already implements dense ranking
                    const currentRank = entry.rank_position;
                    
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          entry.user_id === user?.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-12">
                          {getRankIcon(currentRank)}
                          <Badge variant={getRankBadgeVariant(currentRank)}>
                            #{currentRank}
                          </Badge>
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {entry.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.display_name || 'Anonymous User'}
                            {entry.user_id === user?.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {entry.contacts_count} contacts
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            ${Number(entry.total_revenue).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <AdminChallengeControls />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}