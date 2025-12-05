import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Plus, Trash2, Calendar, Users, Target, Book, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ChallengeConfig {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  current_day: number;
  total_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  count_required?: number;
  outreach_type?: string;
  week_numbers?: number[];
  resource_id?: string;
  external_link?: string;
  external_link_text?: string;
  created_at: string;
}

interface EducationalResource {
  id: string;
  title: string;
  category: string;
}

const ChallengeManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig | null>(null);
  const [dailyTasks, setDailyTasks] = useState<TaskDefinition[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<TaskDefinition[]>([]);
  const [programTasks, setProgramTasks] = useState<TaskDefinition[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<TaskDefinition[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("challenge");
  const [educationalResources, setEducationalResources] = useState<EducationalResource[]>([]);

  useEffect(() => {
    fetchChallengeData();
    fetchEducationalResources();
  }, []);

  const fetchChallengeData = async () => {
    try {
      setLoading(true);
      
      // Fetch challenge config
      const { data: configData, error: configError } = await supabase
        .from('challenge_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (configError) throw configError;
      setChallengeConfig(configData?.[0] || null);

      // Fetch all task definitions
      await Promise.all([
        fetchTaskDefinitions('daily_tasks_definition', setDailyTasks),
        fetchTaskDefinitions('weekly_tasks_definition', setWeeklyTasks),
        fetchTaskDefinitions('program_tasks_definition', setProgramTasks),
        fetchTaskDefinitions('onboarding_tasks_definition', setOnboardingTasks),
      ]);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch challenge data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationalResources = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_resources')
        .select('id, title, category')
        .eq('is_published', true)
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      setEducationalResources(data || []);
    } catch (error: any) {
      console.error('Error fetching educational resources:', error);
    }
  };

  const fetchTaskDefinitions = async (tableName: string, setter: (tasks: TaskDefinition[]) => void) => {
    let query;
    
    if (tableName === 'daily_tasks_definition') {
      query = supabase.from('daily_tasks_definition').select('*').order('sort_order', { ascending: true });
    } else if (tableName === 'weekly_tasks_definition') {
      query = supabase.from('weekly_tasks_definition').select('*').order('sort_order', { ascending: true });
    } else if (tableName === 'program_tasks_definition') {
      query = supabase.from('program_tasks_definition').select('*').order('sort_order', { ascending: true });
    } else if (tableName === 'onboarding_tasks_definition') {
      query = supabase.from('onboarding_tasks_definition').select('*').order('sort_order', { ascending: true });
    } else {
      throw new Error(`Unknown table: ${tableName}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    setter(data || []);
  };

  const handleSaveChallenge = async (challengeData: Partial<ChallengeConfig>) => {
    try {
      if (challengeConfig) {
        // Update existing challenge
        const { error } = await supabase
          .from('challenge_config')
          .update({
            name: challengeData.name,
            start_date: challengeData.start_date,
            end_date: challengeData.end_date,
            current_day: challengeData.current_day,
            total_days: challengeData.total_days,
            is_active: challengeData.is_active,
          })
          .eq('id', challengeConfig.id);

        if (error) throw error;
      } else {
        // Create new challenge
        const { error } = await supabase
          .from('challenge_config')
          .insert({
            name: challengeData.name,
            start_date: challengeData.start_date,
            end_date: challengeData.end_date,
            current_day: challengeData.current_day ?? 0,
            total_days: challengeData.total_days || 75,
            is_active: challengeData.is_active !== false,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Challenge configuration saved successfully",
      });
      
      fetchChallengeData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save challenge: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveTask = async (taskData: Partial<TaskDefinition>, taskType: string) => {
    try {
      console.log('Saving task:', { taskData, taskType });
      
      if (selectedTask) {
        // Update existing task based on type
        let updateQuery;
        if (taskType === 'daily') {
          updateQuery = supabase.from('daily_tasks_definition').update({
            name: taskData.name,
            description: taskData.description,
            category: taskData.category,
            sort_order: taskData.sort_order,
            is_active: taskData.is_active,
            count_required: taskData.count_required,
            outreach_type: taskData.outreach_type as any,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          }).eq('id', selectedTask.id);
        } else if (taskType === 'weekly') {
          updateQuery = supabase.from('weekly_tasks_definition').update({
            name: taskData.name,
            description: taskData.description,
            category: taskData.category,
            sort_order: taskData.sort_order,
            is_active: taskData.is_active,
            week_numbers: taskData.week_numbers,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          }).eq('id', selectedTask.id);
        } else if (taskType === 'program') {
          updateQuery = supabase.from('program_tasks_definition').update({
            name: taskData.name,
            description: taskData.description,
            category: taskData.category,
            sort_order: taskData.sort_order,
            is_active: taskData.is_active,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          }).eq('id', selectedTask.id);
        } else if (taskType === 'onboarding') {
          updateQuery = supabase.from('onboarding_tasks_definition').update({
            name: taskData.name,
            description: taskData.description,
            category: taskData.category,
            sort_order: taskData.sort_order,
            is_active: taskData.is_active,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          }).eq('id', selectedTask.id);
        } else {
          throw new Error(`Unknown task type: ${taskType}`);
        }
        
        const { error } = await updateQuery;
        if (error) throw error;
      } else {
        // Create new task based on type
        let insertQuery;
        if (taskType === 'daily') {
          insertQuery = supabase.from('daily_tasks_definition').insert({
            name: taskData.name!,
            description: taskData.description || '',
            category: taskData.category || 'General',
            sort_order: taskData.sort_order || 0,
            is_active: taskData.is_active !== false,
            count_required: taskData.count_required || 1,
            outreach_type: taskData.outreach_type as any || null,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          });
        } else if (taskType === 'weekly') {
          insertQuery = supabase.from('weekly_tasks_definition').insert({
            name: taskData.name!,
            description: taskData.description || '',
            category: taskData.category || 'General',
            sort_order: taskData.sort_order || 0,
            is_active: taskData.is_active !== false,
            week_numbers: taskData.week_numbers || null,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          });
        } else if (taskType === 'program') {
          insertQuery = supabase.from('program_tasks_definition').insert({
            name: taskData.name!,
            description: taskData.description || '',
            category: taskData.category || 'General',
            sort_order: taskData.sort_order || 0,
            is_active: taskData.is_active !== false,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          });
        } else if (taskType === 'onboarding') {
          insertQuery = supabase.from('onboarding_tasks_definition').insert({
            name: taskData.name!,
            description: taskData.description || '',
            category: taskData.category || 'General',
            sort_order: taskData.sort_order || 0,
            is_active: taskData.is_active !== false,
            resource_id: taskData.resource_id === 'none' ? null : taskData.resource_id || null,
            external_link: taskData.external_link || null,
            external_link_text: taskData.external_link_text || null,
          });
        } else {
          throw new Error(`Unknown task type: ${taskType}`);
        }
        
        const { error } = await insertQuery;
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "Task saved successfully",
      });
      
      setIsEditing(false);
      setSelectedTask(null);
      fetchChallengeData();
    } catch (error: any) {
      console.error('Failed to save task:', error);
      toast({
        title: "Error",
        description: `Failed to save task: ${error.message || error.details || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string, taskType: string) => {
    try {
      let deleteQuery;
      if (taskType === 'daily') {
        deleteQuery = supabase.from('daily_tasks_definition').delete().eq('id', taskId);
      } else if (taskType === 'weekly') {
        deleteQuery = supabase.from('weekly_tasks_definition').delete().eq('id', taskId);
      } else if (taskType === 'program') {
        deleteQuery = supabase.from('program_tasks_definition').delete().eq('id', taskId);
      } else if (taskType === 'onboarding') {
        deleteQuery = supabase.from('onboarding_tasks_definition').delete().eq('id', taskId);
      } else {
        throw new Error(`Unknown task type: ${taskType}`);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      
      fetchChallengeData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete task: " + error.message,
        variant: "destructive",
      });
    }
  };

  const TaskTable = ({ tasks, taskType, icon: Icon }: { tasks: TaskDefinition[], taskType: string, icon: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="capitalize">{taskType} Tasks</CardTitle>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setSelectedTask(null)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <TaskEditor
              task={selectedTask}
              taskType={taskType}
              onSave={(taskData) => handleSaveTask(taskData, taskType)}
              onCancel={() => {
                setIsEditing(false);
                setSelectedTask(null);
              }}
              educationalResources={educationalResources}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order</TableHead>
              {taskType === 'weekly' && <TableHead>Weeks</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.category || 'General'}</TableCell>
                <TableCell>{task.sort_order}</TableCell>
                {taskType === 'weekly' && (
                  <TableCell>
                    {task.week_numbers?.length ? task.week_numbers.join(', ') : 'All weeks'}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={task.is_active ? "default" : "secondary"}>
                    {task.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.external_link && task.external_link_text ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">{task.external_link_text}</span>
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No link</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id, taskType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin")}
              className="hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-primary">
                Challenge Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage challenges, tasks, and user engagement
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30">
            <TabsTrigger value="challenge" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Challenge
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="program" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Program
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Onboarding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenge">
            <ChallengeEditor 
              challenge={challengeConfig} 
              onSave={handleSaveChallenge} 
            />
          </TabsContent>

          <TabsContent value="daily">
            <TaskTable tasks={dailyTasks} taskType="daily" icon={Clock} />
          </TabsContent>

          <TabsContent value="weekly">
            <TaskTable tasks={weeklyTasks} taskType="weekly" icon={Target} />
          </TabsContent>

          <TabsContent value="program">
            <TaskTable tasks={programTasks} taskType="program" icon={Book} />
          </TabsContent>

          <TabsContent value="onboarding">
            <TaskTable tasks={onboardingTasks} taskType="onboarding" icon={Users} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ChallengeEditor = ({ challenge, onSave }: { challenge: ChallengeConfig | null, onSave: (data: Partial<ChallengeConfig>) => void }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: challenge?.name || '',
    start_date: challenge?.start_date || '',
    end_date: challenge?.end_date || '',
    current_day: challenge?.current_day ?? 0,
    total_days: challenge?.total_days || 75,
    is_active: challenge?.is_active ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Challenge Configuration</CardTitle>
            <CardDescription>
              Manage the main challenge settings and timeline
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Challenge Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="75 Hard Holiday Edition"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active Challenge</Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current_day">Current Day</Label>
            <Input
              id="current_day"
              type="number"
              min="0"
              value={formData.current_day}
              onChange={(e) => setFormData(prev => ({ ...prev, current_day: parseInt(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 if challenge hasn't started yet. Tasks will be gated by start date.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="total_days">Total Days</Label>
            <Input
              id="total_days"
              type="number"
              min="1"
              value={formData.total_days}
              onChange={(e) => setFormData(prev => ({ ...prev, total_days: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <Button onClick={() => onSave(formData)} className="w-full">
          Save Challenge Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

const TaskEditor = ({ task, taskType, onSave, onCancel, educationalResources }: { 
  task: TaskDefinition | null, 
  taskType: string, 
  onSave: (data: Partial<TaskDefinition>) => void, 
  onCancel: () => void,
  educationalResources: EducationalResource[]
}) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    category: task?.category || '',
    sort_order: task?.sort_order || 0,
    is_active: task?.is_active ?? true,
    count_required: task?.count_required || 1,
    outreach_type: task?.outreach_type || '',
    week_numbers: task?.week_numbers || [],
    resource_id: task?.resource_id || 'none',
    external_link: task?.external_link || '',
    external_link_text: task?.external_link_text || '',
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{task ? 'Edit' : 'Create'} {taskType} Task</DialogTitle>
        <DialogDescription>
          {task ? 'Update the task details' : 'Create a new task for users to complete'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-name">Task Name</Label>
          <Input
            id="task-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter task name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter task description"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-category">Category</Label>
            <Input
              id="task-category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Outreach, Personal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-order">Sort Order</Label>
            <Input
              id="task-order"
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resource-select">Linked Resource (Optional)</Label>
          <Select 
            value={formData.resource_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, resource_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a resource to link with this task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Resource</SelectItem>
              {educationalResources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    <span>{resource.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {resource.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Link this task to a helpful resource that participants can reference while completing it.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            <Label className="text-base font-medium">External Link (Optional)</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="external-link-text">Link Text</Label>
              <Input
                id="external-link-text"
                value={formData.external_link_text}
                onChange={(e) => setFormData(prev => ({ ...prev, external_link_text: e.target.value }))}
                placeholder="e.g., Watch Tutorial, Read Guide"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="external-link">Link URL</Label>
              <Input
                id="external-link"
                value={formData.external_link}
                onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Add an external link (like a tutorial or guide) that participants can access while completing this task.
          </p>
        </div>

        {taskType === 'daily' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="count-required">Count Required</Label>
              <Input
                id="count-required"
                type="number"
                min="1"
                value={formData.count_required}
                onChange={(e) => setFormData(prev => ({ ...prev, count_required: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outreach-type">Outreach Type</Label>
              <Input
                id="outreach-type"
                value={formData.outreach_type}
                onChange={(e) => setFormData(prev => ({ ...prev, outreach_type: e.target.value }))}
                placeholder="e.g., email, linkedin"
              />
            </div>
          </div>
        )}

        {taskType === 'weekly' && (
          <div className="space-y-2">
            <Label htmlFor="week-numbers">Week Numbers</Label>
            <Input
              id="week-numbers"
              value={formData.week_numbers.join(', ')}
              onChange={(e) => {
                const weeks = e.target.value
                  .split(',')
                  .map(w => parseInt(w.trim()))
                  .filter(w => !isNaN(w) && w > 0);
                setFormData(prev => ({ ...prev, week_numbers: weeks }));
              }}
              placeholder="e.g., 1, 3, 5 (leave blank for all weeks)"
            />
            <p className="text-xs text-muted-foreground">
              Enter week numbers separated by commas. Leave blank to apply to all weeks.
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="task-active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="task-active">Active Task</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave(formData)} className="flex-1">
            {task ? 'Update' : 'Create'} Task
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default ChallengeManagement;