import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle, Network, RefreshCw, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TaskProgressCard } from '@/components/TaskProgressCard';

interface ProgramTask {
  id: string;
  task_definition_id: string;
  name: string;
  description?: string;
  category?: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  resource_id?: string;
  resource_title?: string;
  external_link?: string;
  external_link_text?: string;
}

export const ProgramTasks: React.FC = () => {
  const [tasks, setTasks] = useState<ProgramTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('ProgramTasks useEffect triggered, user:', user?.id);
    if (user?.id) {
      loadProgramTasks();
    }
  }, [user]);

  const loadProgramTasks = async () => {
    if (!user?.id) return;

    console.log('Loading program tasks for user:', user.id);
    setLoading(true);
    try {
      // Get the task definitions
      const { data: taskDefinitions, error: defError } = await supabase
        .from('program_tasks_definition')
        .select(`
          *,
          educational_resources(
            id,
            title
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      console.log('Program task definitions response:', { data: taskDefinitions, error: defError });

      if (defError) throw defError;

      if (!taskDefinitions || taskDefinitions.length === 0) {
        console.log('No program task definitions found');
        setTasks([]);
        return;
      }

      // Get user's task completion status
      const { data: userTasks, error: userError } = await supabase
        .from('user_program_tasks')
        .select('*')
        .eq('user_id', user.id);

      console.log('User program tasks response:', { data: userTasks, error: userError });

      if (userError) throw userError;

      // Combine task definitions with user completion status
      const formattedTasks: ProgramTask[] = taskDefinitions.map(def => {
        const userTask = userTasks?.find(ut => ut.program_task_definition_id === def.id);
        return {
          id: userTask?.id || def.id,
          task_definition_id: def.id,
          name: def.name,
          description: def.description,
          category: def.category,
          completed: userTask?.completed || false,
          completed_at: userTask?.completed_at || null,
          sort_order: def.sort_order,
          resource_id: def.resource_id,
          resource_title: def.educational_resources?.title,
          external_link: def.external_link,
          external_link_text: def.external_link_text,
        };
      });

      console.log('Formatted program tasks:', formattedTasks);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading program tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load program tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    if (!user?.id) return;

    try {
      const task = tasks.find(t => t.task_definition_id === taskId);
      if (!task) return;

      const taskName = task.name;

      if (completed) {
        // Create or update user task record
        const { error } = await supabase
          .from('user_program_tasks')
          .upsert({
            user_id: user.id,
            program_task_definition_id: taskId,
            completed: true,
            completed_at: new Date().toISOString(),
            notes: 'Manually marked as complete'
          });

        if (error) throw error;

        // Award points for completion
        const { error: pointsError } = await supabase.rpc('award_points', {
          p_user_id: user.id,
          p_activity_type: 'program_task_completed',
          p_description: `Completed program task: ${taskName}`,
          p_metadata: {
            task_id: taskId,
            task_name: taskName
          }
        });
        
        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        }
      } else {
        // Remove or update user task record
        const { error } = await supabase
          .from('user_program_tasks')
          .update({
            completed: false,
            completed_at: null
          })
          .eq('user_id', user.id)
          .eq('program_task_definition_id', taskId);

        if (error) throw error;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.task_definition_id === taskId 
          ? { 
              ...task, 
              completed, 
              completed_at: completed ? new Date().toISOString() : null
            }
          : task
      ));

      if (completed) {
        toast({
          title: "Program milestone achieved! 🎉",
          description: "Great work on completing your program task"
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
            <Network className="w-5 h-5" />
            Program Tasks
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
            <Network className="w-5 h-5" />
            Program Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No program tasks available</p>
            <p className="text-xs mt-1">Program tasks will appear here as you progress through the challenge</p>
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
              <Network className="w-5 h-5" />
              Program Tasks
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Networking and program milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProgramTasks}
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Resync
            </Button>
            <Badge variant={completedTasks === totalTasks && totalTasks > 0 ? "default" : "secondary"}>
              {completedTasks}/{totalTasks} Complete
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TaskProgressCard 
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          title="Program Progress"
        />
        <div className="space-y-3 mt-4">
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
                id={task.task_definition_id}
                checked={task.completed}
                onCheckedChange={(checked) => toggleTaskCompletion(task.task_definition_id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor={task.task_definition_id}
                  className={`block font-medium cursor-pointer ${
                    task.completed ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {task.name}
                </label>
                {task.description && (
                  <p className={`text-sm mt-1 ${
                    task.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
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
      </CardContent>
    </Card>
  );
};