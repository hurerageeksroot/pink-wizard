import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TaskProgressCard } from '@/components/TaskProgressCard';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTask {
  id: string;
  task_id: string;
  name: string;
  description?: string;
  category?: string;
  completed: boolean;
  completed_at: string | null;
  notes?: string;
  external_link?: string;
  external_link_text?: string;
}

export const OnboardingTasks: React.FC = () => {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadOnboardingTasks();
    }
  }, [user]);

  const loadOnboardingTasks = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get all active task definitions first
      const { data: taskDefinitions, error: defError } = await supabase
        .from('onboarding_tasks_definition')
        .select('id')
        .eq('is_active', true);

      if (defError) throw defError;

      if (!taskDefinitions || taskDefinitions.length === 0) {
        setTasks([]);
        return;
      }

      // Check which tasks already exist for this user
      const { data: existingTasks, error: checkError } = await supabase
        .from('user_onboarding_tasks')
        .select('task_id')
        .eq('user_id', user.id);

      if (checkError) throw checkError;

      const existingTaskIds = existingTasks?.map(t => t.task_id) || [];
      
      // Filter out tasks that already exist
      const missingTaskDefinitions = taskDefinitions.filter(def => !existingTaskIds.includes(def.id));

      // Create missing tasks only
      if (missingTaskDefinitions.length > 0) {
        const tasksToCreate = missingTaskDefinitions.map(def => ({
          user_id: user.id,
          task_id: def.id,
          completed: false
        }));

        const { error: insertError } = await supabase
          .from('user_onboarding_tasks')
          .insert(tasksToCreate);

        if (insertError) throw insertError;
      }

      // Fetch tasks with definitions
      const { data: userTasks, error } = await supabase
        .from('user_onboarding_tasks')
        .select(`
          id,
          task_id,
          completed,
          completed_at,
          notes,
          onboarding_tasks_definition!inner(
            name,
            description,
            category,
            sort_order,
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
        .order('onboarding_tasks_definition(sort_order)', { ascending: true });

      if (error) throw error;

      const formattedTasks: OnboardingTask[] = userTasks?.map(task => ({
        id: task.id,
        task_id: task.task_id,
        name: (task as any).onboarding_tasks_definition.name,
        description: (task as any).onboarding_tasks_definition.description,
        category: (task as any).onboarding_tasks_definition.category,
        completed: task.completed,
        completed_at: task.completed_at,
        notes: task.notes,
        external_link: (task as any).onboarding_tasks_definition.external_link,
        external_link_text: (task as any).onboarding_tasks_definition.external_link_text,
      })) || [];

      console.log('🚨 ONBOARDING TASKS LOADED:', formattedTasks);
      formattedTasks.forEach(task => {
        console.log(`🚨 Task: ${task.name}, External Link: "${task.external_link}", Link Text: "${task.external_link_text}"`);
      });

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading onboarding tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const taskName = task?.name || 'Onboarding task';

      const { error } = await supabase
        .from('user_onboarding_tasks')
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
          p_activity_type: 'onboarding_task_completed',
          p_description: `Completed onboarding task: ${taskName}`,
          p_metadata: {
            task_id: taskId,
            task_name: taskName
          }
        });
        
        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        }
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              completed, 
              completed_at: completed ? new Date().toISOString() : null 
            }
          : task
      ));

      if (completed) {
        toast({
          title: "Great progress! 🎉",
          description: "Onboarding task completed"
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Onboarding Tasks
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

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Onboarding Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No onboarding tasks available</p>
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
              <BookOpen className="w-5 h-5" />
              Onboarding Tasks
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get started with the essentials
            </p>
          </div>
          <Badge variant={completedTasks === totalTasks && totalTasks > 0 ? "default" : "secondary"}>
            {completedTasks}/{totalTasks} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <TaskProgressCard 
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          title="Onboarding Progress"
        />
        <div className="space-y-3 mt-4">
          {tasks.map((task) => (
            <div key={task.id}>
              <div 
                className={`relative flex items-start gap-3 p-3 rounded-lg border transition-colors ${
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
                  <div className={`block font-medium ${
                    task.completed ? 'text-muted-foreground line-through' : ''
                  }`}>
                    {task.name}
                  </div>
                  {task.description && (
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {task.description}
                    </p>
                  )}
                  {task.category && (
                    <Badge variant="outline" className="text-xs mt-2">
                      {task.category}
                    </Badge>
                  )}
                  {task.external_link && task.external_link_text && (
                    <div className="mt-3">
                      {task.external_link.startsWith('/') || task.external_link.includes('pink-wizard.com') ? (
                        <Link 
                          to={task.external_link.startsWith('/') ? task.external_link : new URL(task.external_link).pathname + new URL(task.external_link).search}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors font-medium"
                        >
                          <span>{task.external_link_text}</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : (
                        <a 
                          href={task.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors font-medium"
                        >
                          <span>{task.external_link_text}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {task.completed && (
                  <CheckSquare className="w-5 h-5 text-primary mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};