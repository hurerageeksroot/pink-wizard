import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Users, Target, Trophy, Zap, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useChallengeParticipantCount } from '@/hooks/useChallengeParticipantCount';

interface AuditResults {
  currentDay: number;
  activeParticipants: number;
  missingDailyTasks: number;
  participantsWithZeroPoints: number;
  participantsWithoutAnyTasks: number;
  participantsMissingDay1: number;
  participantsMissingDay1List: string[];
  participantsWithoutAnyTasksList: string[];
  tasksBackfilled: number;
  tasksCreated: number;
  tasksCompleted: number;
  bonusesAwarded: number;
  eligibleNotEnrolled: number;
  enrolledByAudit: number;
  errors: string[];
}

interface AuditResponse {
  success: boolean;
  results: AuditResults;
  dryRun: boolean;
  message: string;
}

type StatusType = 'healthy' | 'attention' | 'critical';

export default function ChallengeAudit() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuditResults | null>(null);
  const [lastRunType, setLastRunType] = useState<'dry-run' | 'auto-fix' | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<StatusType>('healthy');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [quickResults, setQuickResults] = useState<AuditResults | null>(null);
  const [enrollMissingParticipants, setEnrollMissingParticipants] = useState(false);
  const [progressUpdateLoading, setProgressUpdateLoading] = useState(false);
  const { count: participantCount, refetch: refetchParticipantCount } = useChallengeParticipantCount();

  const runStatusCheck = async () => {
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-challenge', {
        body: { dryRun: true }
      });

      if (error) throw error;

      const response = data as AuditResponse;
      setQuickResults(response.results);
      setLastChecked(new Date());
      
      // Determine status based on audit results
      const hasErrors = response.results.errors.length > 0;
      const hasMissingTasks = response.results.missingDailyTasks > 0;
      const hasZeroPointUsers = response.results.participantsWithZeroPoints > 5; // More than 5 is concerning
      const hasMissingDay1 = response.results.participantsMissingDay1 > 0;
      const hasParticipantsWithoutTasks = response.results.participantsWithoutAnyTasks > 0;
      
      if (hasErrors) {
        setSystemStatus('critical');
      } else if (hasMissingTasks || hasZeroPointUsers || hasMissingDay1 || hasParticipantsWithoutTasks) {
        setSystemStatus('attention');
      } else {
        setSystemStatus('healthy');
      }
    } catch (error) {
      console.error('Status check error:', error);
      setSystemStatus('critical');
      setLastChecked(new Date());
    } finally {
      setStatusLoading(false);
    }
  };

  const runAudit = async (dryRun: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-challenge', {
        body: { dryRun, enrollMissingParticipants }
      });

      if (error) throw error;

      const response = data as AuditResponse;
      setResults(response.results);
      setLastRunType(dryRun ? 'dry-run' : 'auto-fix');
      
      // Update status after running audit
      if (!dryRun) {
        await runStatusCheck();
        await refetchParticipantCount();
      }
      
      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error('Audit completed with errors');
      }
    } catch (error) {
      console.error('Audit error:', error);
      toast.error('Failed to run audit');
    } finally {
      setLoading(false);
    }
  };

  const updateChallengeProgress = async () => {
    setProgressUpdateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-challenge-progress');
      
      if (error) throw error;
      
      toast.success('Challenge progress updated successfully!');
      
      // Refresh status and participant count
      await runStatusCheck();
      await refetchParticipantCount();
      
    } catch (error) {
      console.error('Progress update error:', error);
      toast.error('Failed to update challenge progress');
    } finally {
      setProgressUpdateLoading(false);
    }
  };

  useEffect(() => {
    runStatusCheck();
  }, []);

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
          label: 'Healthy',
          description: 'All systems operational'
        };
      case 'attention':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          icon: AlertTriangle,
          label: 'Needs Attention',
          description: 'Minor issues detected'
        };
      case 'critical':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: AlertTriangle,
          label: 'Critical',
          description: 'Immediate action required'
        };
    }
  };

  const statusConfig = getStatusConfig(systemStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Challenge Audit</h1>
        <p className="text-muted-foreground mt-2">
          Audit and fix challenge participant data, tasks, and points
        </p>
      </div>

      {/* Status Overview */}
      <Card className={`border-l-4 ${statusConfig.bgColor}`} style={{ borderLeftColor: statusConfig.color.replace('bg-', '') === 'green-500' ? '#10b981' : statusConfig.color.replace('bg-', '') === 'yellow-500' ? '#f59e0b' : '#ef4444' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
              <div>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                  System Status: {statusConfig.label}
                </CardTitle>
                <CardDescription className="mt-1">
                  {statusConfig.description}
                  {lastChecked && (
                    <span className="ml-2 text-xs">
                      • Last checked: {lastChecked.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runStatusCheck}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-check
              </Button>
              {systemStatus === 'attention' && quickResults && (
                <Button
                  size="sm"
                  onClick={() => runAudit(false)}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Auto-Fix Issues
                </Button>
              )}
              {systemStatus === 'critical' && (
                <Button
                  size="sm"
                  onClick={() => runAudit(false)}
                  disabled={loading}
                  variant="destructive"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                  Emergency Fix
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {quickResults && systemStatus !== 'healthy' && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {quickResults.errors.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{quickResults.errors.length} errors</span>
                 </div>
               )}
               {quickResults.participantsMissingDay1 > 0 && (
                 <div className="flex items-center gap-2">
                   <Target className="w-4 h-4 text-red-500" />
                   <span>{quickResults.participantsMissingDay1} missing Day 1 tasks</span>
                 </div>
               )}
               {quickResults.participantsWithoutAnyTasks > 0 && (
                 <div className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-red-500" />
                   <span>{quickResults.participantsWithoutAnyTasks} users with no tasks</span>
                 </div>
               )}
               {quickResults.missingDailyTasks > 0 && (
                 <div className="flex items-center gap-2">
                   <Target className="w-4 h-4 text-yellow-500" />
                   <span>{quickResults.missingDailyTasks} missing current day tasks</span>
                 </div>
               )}
               {quickResults.participantsWithZeroPoints > 5 && (
                 <div className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-yellow-500" />
                   <span>{quickResults.participantsWithZeroPoints} users with no points</span>
                 </div>
               )}
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span>Day {quickResults.currentDay}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enrollMissingParticipants}
              onChange={(e) => setEnrollMissingParticipants(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Enroll missing participants (subscribers, active payments, trials)</span>
          </label>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={() => runAudit(true)}
            disabled={loading}
            variant="outline"
          >
            {loading && lastRunType === 'dry-run' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Dry Run (Analysis Only)
          </Button>
          <Button
            onClick={() => runAudit(false)}
            disabled={loading}
            variant="default"
          >
            {loading && lastRunType === 'auto-fix' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Auto-Fix (Backfill + Update)
          </Button>
          <Button
            onClick={updateChallengeProgress}
            disabled={progressUpdateLoading}
            variant="secondary"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {progressUpdateLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Update Progress & Streaks
          </Button>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          {results.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Errors encountered:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Day</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.currentDay}</div>
                <p className="text-xs text-muted-foreground">
                  Challenge day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.activeParticipants}</div>
                <p className="text-xs text-muted-foreground">
                  Total participants (Source: {participantCount})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Tasks (Current Day)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.missingDailyTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Current day task rows to create
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zero Points</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.participantsWithZeroPoints}</div>
                <p className="text-xs text-muted-foreground">
                  Participants with no points
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participants missing Day 1 tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{results.participantsMissingDay1}</div>
                <p className="text-xs text-muted-foreground">
                  Users without Day 1 task initialization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participants without any tasks</CardTitle>
                <Users className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{results.participantsWithoutAnyTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Users with zero daily task rows
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks backfilled</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{results.tasksBackfilled}</div>
                <p className="text-xs text-muted-foreground">
                  Historical task rows created
                </p>
              </CardContent>
            </Card>

            {enrollMissingParticipants && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eligible not enrolled</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{results.eligibleNotEnrolled || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Users eligible for challenge
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {lastRunType === 'auto-fix' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{results.tasksCreated}</div>
                  <p className="text-xs text-muted-foreground">
                    Missing tasks added
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{results.tasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks marked complete
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bonuses Awarded</CardTitle>
                  <Zap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{results.bonusesAwarded}</div>
                  <p className="text-xs text-muted-foreground">
                    Performance bonuses
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Audit Summary
                <Badge variant={lastRunType === 'dry-run' ? 'secondary' : 'default'}>
                  {lastRunType === 'dry-run' ? 'Dry Run' : 'Auto-Fix Applied'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {lastRunType === 'dry-run' 
                  ? 'Preview of changes that would be made. No data was modified.'
                  : 'Changes have been applied to the database.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Found {results.activeParticipants} active challenge participants</p>
                <p>• Challenge is currently on day {results.currentDay}</p>
                <p>• {results.participantsMissingDay1} participants missing Day 1 tasks</p>
                <p>• {results.participantsWithoutAnyTasks} participants without any tasks</p>
                <p>• {results.missingDailyTasks} current day task rows need to be created</p>
                <p>• {results.participantsWithZeroPoints} participants have zero points</p>
                {enrollMissingParticipants && (
                  <p>• {results.eligibleNotEnrolled || 0} eligible users not yet enrolled</p>
                )}
                {lastRunType === 'auto-fix' && (
                  <>
                    <p className="text-green-600">• Backfilled {results.tasksBackfilled} historical task rows</p>
                    <p className="text-green-600">• Created {results.tasksCreated} missing current day task rows</p>
                    <p className="text-green-600">• Completed {results.tasksCompleted} tasks based on outreach</p>
                    <p className="text-green-600">• Awarded bonuses for {results.bonusesAwarded} participants</p>
                    {enrollMissingParticipants && results.enrolledByAudit > 0 && (
                      <p className="text-green-600">• Enrolled {results.enrolledByAudit} new participants</p>
                    )}
                    <p className="text-green-600">• Updated leaderboard statistics</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}