import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, Target, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTimezoneAwareWeek } from '@/hooks/useTimezoneAwareWeek';
import { TaskProgressCard } from '@/components/TaskProgressCard';

interface WeeklyTask {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  category?: string;
  completed: boolean;
  completed_at: string | null;
  notes?: string;
  week_number: number;
  resource_id?: string;
  resource_title?: string;
  external_link?: string;
  external_link_text?: string;
}

export const WeeklyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentWeek, currentDay, timezone, loading: weekLoading } = useTimezoneAwareWeek();

  useEffect(() => {
    if (user?.id && !weekLoading && currentWeek) {
      loadWeeklyTasks();
    }
  }, [user, currentWeek, weekLoading]);

  const loadWeeklyTasks = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Auto-create weekly tasks if they don't exist
      await ensureWeeklyTasksExist();

      // Fetch the tasks for current week
      const { data: userTasks, error } = await supabase
        .from('user_weekly_tasks')
        .select(`
          id,
          task_id,
          completed,
          completed_at,
          notes,
          week_number,
          weekly_tasks_definition!inner(
            name,
            description,
            category,
            resource_id,
            external_link,
            external_link_text,
            educational_resources(
              id,
              title
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('week_number', currentWeek);

      if (error) throw error;

      const formattedTasks: WeeklyTask[] = userTasks?.map(task => ({
        id: task.id,
        task_id: task.task_id,
        name: (task as any).weekly_tasks_definition.name,
        description: (task as any).weekly_tasks_definition.description,
        category: (task as any).weekly_tasks_definition.category,
        completed: task.completed,
        completed_at: task.completed_at,
        notes: task.notes,
        week_number: task.week_number,
        resource_id: (task as any).weekly_tasks_definition.resource_id,
        resource_title: (task as any).weekly_tasks_definition.educational_resources?.title,
        external_link: (task as any).weekly_tasks_definition.external_link,
        external_link_text: (task as any).weekly_tasks_definition.external_link_text,
      })) || [];

      // Sort tasks: incomplete first, then completed by completion date
      const sortedTasks = formattedTasks.sort((a, b) => {
        if (a.completed === b.completed) {
          if (a.completed && a.completed_at && b.completed_at) {
            return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
          }
          return a.name.localeCompare(b.name);
        }
        return a.completed ? 1 : -1;
      });

      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading weekly tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load weekly tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureWeeklyTasksExist = async () => {
    if (!user?.id) return;

    // Get applicable weekly task definitions first
    const { data: taskDefinitions, error } = await supabase
      .from('weekly_tasks_definition')
      .select('id, week_numbers')
      .eq('is_active', true);

    if (error) throw error;

    const applicableTasks = taskDefinitions?.filter(def => 
      !def.week_numbers || def.week_numbers.length === 0 || def.week_numbers.includes(currentWeek)
    ) || [];

    if (applicableTasks.length === 0) return;

    // Check which tasks already exist for current week
    const { data: existingTasks } = await supabase
      .from('user_weekly_tasks')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('week_number', currentWeek);

    const existingTaskIds = existingTasks?.map(t => t.task_id) || [];
    
    // Filter out tasks that already exist
    const tasksToCreate = applicableTasks
      .filter(def => !existingTaskIds.includes(def.id))
      .map(def => ({
        user_id: user.id,
        task_id: def.id,
        week_number: currentWeek,
        completed: false
      }));

    if (tasksToCreate.length > 0) {
      await supabase.from('user_weekly_tasks').insert(tasksToCreate);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const taskName = task?.name || 'Weekly task';

      const { error } = await supabase
        .from('user_weekly_tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // Award points if task was just completed
      if (completed) {
        const { error: pointsError } = await supabase.rpc('award_points', {
          p_user_id: user?.id,
          p_activity_type: 'weekly_task_completed',
          p_description: `Completed weekly task: ${taskName}`,
          p_metadata: {
            task_id: taskId,
            task_name: taskName
          }
        });
        
        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        }
      }

      setTasks(prev => {
        const updatedTasks = prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                completed, 
                completed_at: completed ? new Date().toISOString() : null 
              }
            : task
        );
        
        // Re-sort tasks after update
        return updatedTasks.sort((a, b) => {
          if (a.completed === b.completed) {
            if (a.completed && a.completed_at && b.completed_at) {
              return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
            }
            return a.name.localeCompare(b.name);
          }
          return a.completed ? 1 : -1;
        });
      });

      if (completed) {
        toast({
          title: "Weekly task completed! 🎉",
          description: "Great work on completing your weekly goal"
        });
      }
    } catch (error) {
      console.error('Error updating weekly task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  if (loading || weekLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Tasks - Week {currentWeek}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Tasks - Week {currentWeek}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({timezone.replace('_', ' ')})
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete your weekly objectives (Day {currentDay})
            </p>
          </div>
          {totalTasks > 0 && (
            <Badge variant={completedTasks === totalTasks ? "default" : "secondary"}>
              {completedTasks}/{totalTasks} Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TaskProgressCard 
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          title={`Week ${currentWeek} Progress`}
        />
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-2">No weekly tasks for this week</p>
            <p className="text-xs">Weekly tasks are configured by administrators and appear when available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  task.completed 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-background border-border hover:bg-muted/20'
                }`}
              >
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={task.id}
                    className={`block font-medium cursor-pointer ${
                      task.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.name}
                  </label>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.resource_id && task.resource_title && (
                    <div className="flex items-center gap-2 mt-2">
                      <a 
                        href={`/resources/${task.resource_id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors h-6"
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
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors h-6"
                        onClick={(e) => {
                          console.log('External link clicked:', task.external_link);
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(task.external_link, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{task.external_link_text}</span>
                      </a>
                    </div>
                  )}
                  {task.category && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  )}
                </div>
                {task.completed && (
                  <CheckSquare className="w-5 h-5 text-primary mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};