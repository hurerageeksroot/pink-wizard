import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ManualTaskCompletion = () => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);

  const JAMIE_USER_ID = '3c8b1935-ca47-40b4-9c97-94b3e881d8d9';
  const TASK_DEFINITIONS = [
    { id: '7f072f13-9f56-4f43-9a4b-832b856860cc', name: 'Cold Contact #1' },
    { id: 'c60d05ac-357f-43ac-9480-3a8e73242eec', name: 'Cold Contact #2' },
    { id: '45ce787c-0d30-4543-9391-5cc0ca78e022', name: 'Cold Contact #3' }
  ];

  useEffect(() => {
    fetchJamiePoints();
  }, []);

  const fetchJamiePoints = async () => {
    try {
      const { data, error } = await supabase
        .from('user_points_ledger')
        .select('points_earned')
        .eq('user_id', JAMIE_USER_ID);

      if (error) {
        console.error('Error fetching points:', error);
        return;
      }

      const total = data?.reduce((sum, entry) => sum + entry.points_earned, 0) || 0;
      setCurrentPoints(total);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const completeJamieTasks = async () => {
    setIsCompleting(true);
    
    try {
      let completedCount = 0;

      for (const taskDef of TASK_DEFINITIONS) {
        console.log(`Completing task via admin RPC: ${taskDef.name}`);
        
        // Use admin RPC function to complete the task
        const { data, error } = await supabase.rpc('admin_complete_daily_task', {
          target_user_id: JAMIE_USER_ID,
          task_definition_id: taskDef.id,
          challenge_day_param: 18,
          admin_notes: 'Admin data consistency fix - marking completed'
        });

        if (error) {
          console.error(`Error completing ${taskDef.name}:`, error);
          toast.error(`Failed to complete ${taskDef.name}: ${error.message}`);
          return;
        }

        completedCount++;
        toast.success(`${taskDef.name} completed successfully`);
      }

      toast.success(`All ${completedCount} tasks completed for Jamie! Data consistency restored.`);
      
      // Refresh points display
      await fetchJamiePoints();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(`Unexpected error: ${error}`);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Jamie Task Fix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Fix data consistency for Jamie Rapavvy's Day 18 tasks.
        </p>
        
        {currentPoints !== null && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Jamie's Current Points: {currentPoints.toLocaleString()}</p>
          </div>
        )}
        
        <div className="space-y-2 text-sm">
          <div>• Cold Contact #1 (mark as completed)</div>
          <div>• Cold Contact #2 (mark as completed)</div>
          <div>• Cold Contact #3 (mark as completed)</div>
        </div>

        <Button 
          onClick={completeJamieTasks}
          disabled={isCompleting}
          className="w-full"
        >
          {isCompleting ? 'Updating Tasks...' : 'Fix Task Completion Status'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManualTaskCompletion;