import React, { useState, useEffect } from 'react';
import { ChallengeAccessGate } from '@/components/ChallengeAccessGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingTasks } from '@/components/OnboardingTasks';
import { WeeklyTasks } from '@/components/WeeklyTasks';
import { ProgramTasks } from '@/components/ProgramTasks';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Plus, Calendar, Trophy, Target, CheckSquare, BookOpen, Star, Network, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOutreachReconciliation } from '@/hooks/useOutreachReconciliation';
import { useChallenge } from '@/hooks/useChallenge';
import { PersonalTasks } from '@/components/PersonalTasks';
import { TaskProgressCard } from '@/components/TaskProgressCard';
import { useToast } from '@/hooks/use-toast';

interface DailyTask {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  category?: string;
  completed: boolean;
  completed_at: string | null;
  notes?: string;
  challenge_day: number;
  resource_id?: string;
  resource_title?: string;
  external_link?: string;
  external_link_text?: string;
  sort_order?: number;
}

interface ManualOutreachForm {
  type: 'cold' | 'warm' | 'social';
  count: number;
  notes: string;
}

interface DailyTasksProps {
  isChallengeParticipant?: boolean;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ isChallengeParticipant }) => {
  // If user is not a challenge participant, only show personal tasks
  if (!isChallengeParticipant) {
    return <PersonalTasks />;
  }

  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentDay, totalDays, isActive } = useChallenge();

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const [activeTab, setActiveTab] = useState<string>(isActive ? 'daily' : 'onboarding');
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualOutreachForm>({
    type: 'cold',
    count: 1,
    notes: ''
  });
  
  const { reconcileOutreach, logOutreachActivity, loading: syncLoading } = useOutreachReconciliation();
  const [userProgress, setUserProgress] = useState<{ totalDaysCompleted: number; currentStreak: number } | null>(null);

  // Load user's challenge progress
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select('total_days_completed, current_streak')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (data && !error) {
        setUserProgress({
          totalDaysCompleted: data.total_days_completed || 0,
          currentStreak: data.current_streak || 0,
        });
      }
    };
    
    fetchUserProgress();
  }, [user]);
  const { toast } = useToast();

  // Load tasks when day changes
  useEffect(() => {
    loadDailyTasks(selectedDay);
  }, [selectedDay, user]);

  const loadDailyTasks = async (challengeDay: number) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Auto-create daily tasks if they don't exist
      await ensureDailyTasksExist(challengeDay);

      // Fetch the tasks for this day, ordered by admin-configured sort_order
      const { data: userTasks, error } = await supabase
        .from('user_daily_tasks')
        .select(`
          id,
          task_id,
          completed,
          completed_at,
          notes,
          challenge_day,
          daily_tasks_definition!inner(
            name,
            description,
            category,
            resource_id,
            external_link,
            external_link_text,
            sort_order,
            educational_resources(
              id,
              title
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('challenge_day', challengeDay);

      if (error) throw error;

      const formattedTasks: DailyTask[] = (userTasks || []).map(task => ({
        id: task.id,
        task_id: task.task_id,
        name: task.daily_tasks_definition.name,
        description: task.daily_tasks_definition.description,
        category: task.daily_tasks_definition.category,
        completed: task.completed,
        completed_at: task.completed_at,
        notes: task.notes,
        challenge_day: task.challenge_day,
        resource_id: task.daily_tasks_definition.resource_id,
        resource_title: task.daily_tasks_definition.educational_resources?.title,
        external_link: task.daily_tasks_definition.external_link,
        external_link_text: task.daily_tasks_definition.external_link_text,
        sort_order: task.daily_tasks_definition.sort_order,
      }));

      // Sort tasks by admin-configured sort_order, respecting completion status
      const sortedTasks = formattedTasks.sort((a, b) => {
        // If completion status is different, incomplete tasks come first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Within the same completion status, sort by admin sort_order
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading daily tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load daily tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureDailyTasksExist = async (challengeDay: number) => {
    if (!user?.id) return;

    try {
      // Get all task definitions for this challenge day first
      const { data: taskDefinitions, error: defError } = await supabase
        .from('daily_tasks_definition')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (defError) throw defError;

      if (!taskDefinitions || taskDefinitions.length === 0) {
        return; // No task definitions for this day
      }

      // Use the new upsert function to ensure all tasks exist (handles duplicates safely)
      const upsertPromises = taskDefinitions.map(def => 
        supabase.rpc('ensure_user_daily_task_exists', {
          p_user_id: user.id,
          p_task_id: def.id,
          p_challenge_day: challengeDay
        })
      );

      await Promise.all(upsertPromises);

    } catch (error) {
      console.error('Error ensuring daily tasks exist:', error);
    }
  };

  const toggleTaskCompletion = async (taskDefinitionId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      console.log(`[DailyTasks] User ${user.email} toggling task ${taskDefinitionId} to ${completed ? 'completed' : 'not completed'} on day ${selectedDay}`);
      
      // Find current task state before making changes
      const currentTask = tasks.find(task => task.task_id === taskDefinitionId);
      if (!currentTask) {
        console.error('[DailyTasks] Task not found in current tasks list:', taskDefinitionId);
        return;
      }
      
      console.log(`[DailyTasks] Current task state - completed: ${currentTask.completed}, name: ${currentTask.name}`);
      
      // Use the proper RPC function that handles both task completion and points awarding
      const { data, error } = await supabase.rpc('toggle_user_daily_task', {
        p_user_id: user.id,
        p_task_id: taskDefinitionId,
        p_challenge_day: selectedDay,
        p_completed: completed
      });
      
      if (error) {
        console.error('[DailyTasks] RPC error for user', user.email, ':', error);
        throw error;
      }
      
      console.log('[DailyTasks] RPC successful:', data);
      
      // Always reload tasks from database to ensure accuracy
      console.log('[DailyTasks] Reloading tasks from database...');
      await loadDailyTasks(selectedDay);
      
      // Show success feedback with points info if awarded
      const pointsMessage = (data as any)?.points_awarded ? " +10 points!" : "";
      toast({
        title: completed ? `Task completed! 🎉${pointsMessage}` : "Task unchecked",
        description: completed 
          ? `Great job completing "${currentTask.name}"!` 
          : `"${currentTask.name}" marked as incomplete.`
      });
      
    } catch (error: any) {
      console.error('[DailyTasks] Error toggling task completion for user', user.email, ':', error);
      
      // Reload tasks to ensure we have the correct state
      await loadDailyTasks(selectedDay);
      
      toast({
        title: "Task Update Failed",
        description: error.message || `Failed to ${completed ? 'complete' : 'uncheck'} task. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleSyncWithOutreach = async () => {
    if (!user?.id) return;
    
    try {
      await reconcileOutreach();
      await loadDailyTasks(selectedDay); // Reload tasks to show updated state
      toast({
        title: "Sync complete! ✨",
        description: "Your outreach activities have been synced with daily tasks."
      });
    } catch (error) {
      console.error('Error syncing outreach:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync outreach activities. Please try again.",
        variant: "destructive"
      });
    }
  };

  const logManualOutreach = async () => {
    if (!user) return;
    
    try {
      await logOutreachActivity(manualForm.type, manualForm.count, manualForm.notes, selectedDay);
      
      // Try to sync automatically after logging
      try {
        await reconcileOutreach();
      } catch (syncError) {
        console.warn('Auto-sync failed after manual logging:', syncError);
      }
      
      toast({
        title: "Outreach Logged",
        description: `${manualForm.count} ${manualForm.type} outreach activities logged for Day ${selectedDay}`,
      });
      
      setManualFormOpen(false);
      setManualForm({ type: 'cold', count: 1, notes: '' });
    } catch (error) {
      console.error('Error logging manual outreach:', error);
      toast({
        title: "Error",
        description: "Failed to log outreach activities. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground">Please sign in to access your tasks.</p>
          <Button onClick={() => navigate('/auth')} className="mt-4">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Challenge Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Onboarding
              </TabsTrigger>
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="program" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Program
              </TabsTrigger>
            </TabsList>

            <TabsContent value="onboarding" className="mt-6">
              <OnboardingTasks />
            </TabsContent>

            <TabsContent value="daily" className="mt-6">
              <ChallengeAccessGate feature="challenge_tasks">
                <div className="space-y-6">
                {/* Challenge Progress Card */}
                <TaskProgressCard 
                  completedTasks={tasks.filter(t => t.completed).length}
                  totalTasks={tasks.length}
                  title={`Day ${selectedDay} Progress`}
                />

                {/* Challenge Day Selection with Progress Indicator */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Select
                        value={selectedDay.toString()}
                        onValueChange={(value) => setSelectedDay(parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              Day {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Progress Status */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Challenge Day:</span>
                      <span className="font-semibold text-primary">{currentDay}</span>
                    </div>
                    {userProgress && (
                      <>
                        <span className="text-muted-foreground">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Completed:</span>
                          <span className="font-semibold text-secondary">{userProgress.totalDaysCompleted}</span>
                        </div>
                        {userProgress.totalDaysCompleted < currentDay && (
                          <>
                            <span className="text-muted-foreground">|</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Behind:</span>
                              <span className="font-semibold text-destructive">{currentDay - userProgress.totalDaysCompleted}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Challenge Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSyncWithOutreach}
                    disabled={syncLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Syncing...' : 'Sync with Outreach'}
                  </Button>
                  
                  <Dialog open={manualFormOpen} onOpenChange={setManualFormOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Log Manual Outreach
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Log Manual Outreach</DialogTitle>
                        <DialogDescription>
                          Record outreach activities completed outside the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="outreach-type">Outreach Type</Label>
                          <Select 
                            value={manualForm.type} 
                            onValueChange={(value: 'cold' | 'warm' | 'social') => 
                              setManualForm(prev => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cold">Cold Outreach</SelectItem>
                              <SelectItem value="warm">Warm Outreach</SelectItem>
                              <SelectItem value="social">Social Media</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="count">Number of Activities</Label>
                          <Input
                            type="number"
                            min="1"
                            value={manualForm.count}
                            onChange={(e) => setManualForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            value={manualForm.notes}
                            onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add any details about your outreach activities..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={logManualOutreach}>
                          Log Activities
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Tasks List */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <Card>
                    <CardContent className="text-center p-8">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tasks available for Day {selectedDay}.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <Card key={task.id} className={`transition-all duration-200 ${task.completed ? 'bg-muted/50' : 'bg-card hover:shadow-md'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => toggleTaskCompletion(task.task_id, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.name}
                                </h4>
                                {task.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {task.category}
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className={`text-sm ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                  {task.description}
                                </p>
                              )}
                              {task.resource_id && task.resource_title && (
                                <div className="flex items-center gap-2 mt-2">
                                  <a 
                                    href={`/resources/${task.resource_id}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    <span>View Resource: {task.resource_title}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              {task.external_link && task.external_link_text && (
                                <div className="flex items-center gap-2 mt-2">
                                  <a 
                                    href={task.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                    onClick={(e) => {
                                      console.log('External link clicked:', task.external_link);
                                      console.log('Event:', e);
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Opening in new tab:', task.external_link);
                                      window.open(task.external_link, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>{task.external_link_text}</span>
                                  </a>
                                </div>
                              )}
                              {task.completed && task.completed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Completed {new Date(task.completed_at).toLocaleDateString()} at{' '}
                                  {new Date(task.completed_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              )}
                              {task.notes && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground font-medium">Notes:</p>
                                  <p className="text-sm">{task.notes}</p>
                                </div>
                              )}
                             </div>
                           </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                )}
                </div>
              </ChallengeAccessGate>
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              <ChallengeAccessGate feature="challenge_tasks">
                <WeeklyTasks />
              </ChallengeAccessGate>
            </TabsContent>

            <TabsContent value="program" className="mt-6">
              <ChallengeAccessGate feature="challenge_tasks">
                <ProgramTasks />
              </ChallengeAccessGate>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};