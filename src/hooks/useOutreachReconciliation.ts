import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface OutreachCounts {
  cold: number;
  warm: number;
  social: number;
}

export const useOutreachReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const logOutreachActivity = async (type: 'cold' | 'warm' | 'social', count: number = 1, notes?: string, challengeDay?: number) => {
    if (!user?.id) return false;

    try {
      const metricName = `${type}_outreach`;
      
      const metricsToInsert = Array.from({ length: count }, () => ({
        user_id: user.id,
        challenge_day: challengeDay || 1, // Use provided day or fallback to 1
        metric_name: metricName,
        metric_type: 'daily_outreach',
        value: 1,
        unit: 'count',
        notes: notes || `${type} outreach activity`
      }));

      const { error } = await supabase
        .from('user_metrics')
        .insert(metricsToInsert);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging outreach activity:', error);
      return false;
    }
  };

  const getCurrentChallengeDay = async (): Promise<number> => {
    try {
      const { data: challengeConfig, error } = await supabase
        .from('challenge_config')
        .select('start_date, current_day')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      console.log('🗓️ [getCurrentChallengeDay] Challenge config:', challengeConfig);

      if (challengeConfig.start_date) {
        const startDate = new Date(challengeConfig.start_date);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const calculatedDay = Math.max(1, Math.min(daysDiff + 1, 75));
        
        console.log('🗓️ [getCurrentChallengeDay] Date calculation:', {
          startDate: startDate.toISOString(),
          currentDate: currentDate.toISOString(),
          daysDiff,
          calculatedDay
        });
        
        return calculatedDay;
      }

      console.log('🗓️ [getCurrentChallengeDay] Using current_day from config:', challengeConfig.current_day);
      return challengeConfig.current_day || 1;
    } catch (error) {
      console.error('❌ [getCurrentChallengeDay] Error getting challenge day:', error);
      return 1; // Safe fallback
    }
  };

  const getOutreachCounts = async (challengeDay: number): Promise<OutreachCounts> => {
    if (!user?.id) {
      return { cold: 0, warm: 0, social: 0 };
    }

    try {
      const { data: metrics, error } = await supabase
        .from('user_metrics')
        .select('metric_name, value')
        .eq('user_id', user.id)
        .eq('challenge_day', challengeDay)
        .in('metric_name', ['cold_outreach', 'warm_outreach', 'social_outreach']);

      if (error) throw error;

      const counts = { cold: 0, warm: 0, social: 0 };
      
      metrics?.forEach((metric) => {
        switch (metric.metric_name) {
          case 'cold_outreach':
            counts.cold += metric.value;
            break;
          case 'warm_outreach':
            counts.warm += metric.value;
            break;
          case 'social_outreach':
            counts.social += metric.value;
            break;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error fetching outreach counts:', error);
      return { cold: 0, warm: 0, social: 0 };
    }
  };

  const ensureDailyTasksExist = async (challengeDay: number) => {
    if (!user?.id) return;

    try {
      // Get all active daily task definitions
      const { data: taskDefinitions, error: defsError } = await supabase
        .from('daily_tasks_definition')
        .select('id')
        .eq('is_active', true);

      if (defsError) throw defsError;

      // Check which tasks already exist for this user/day
      const { data: existingTasks, error: existingError } = await supabase
        .from('user_daily_tasks')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('challenge_day', challengeDay);

      if (existingError) throw existingError;

      const existingTaskIds = new Set(existingTasks?.map(t => t.task_id) || []);
      const tasksToCreate = taskDefinitions?.filter(def => !existingTaskIds.has(def.id)) || [];

      // Create missing tasks
      if (tasksToCreate.length > 0) {
        const newTasks = tasksToCreate.map(taskDef => ({
          user_id: user.id,
          task_id: taskDef.id,
          challenge_day: challengeDay,
          completed: false
        }));

        const { error: insertError } = await supabase
          .from('user_daily_tasks')
          .insert(newTasks);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error ensuring daily tasks exist:', error);
    }
  };

  const updateTaskCompletions = async (challengeDay: number, counts: OutreachCounts) => {
    console.log('🚀 [updateTaskCompletions] Function called with:', { challengeDay, counts, userId: user?.id });
    
    if (!user?.id) {
      console.log('❌ [updateTaskCompletions] No user ID, returning early');
      return;
    }

    console.log('🔄 [updateTaskCompletions] Starting with counts:', counts);

    try {
      // Get task definitions using new structured columns
      const { data: taskDefs, error: defsError } = await supabase
        .from('daily_tasks_definition')
        .select('id, name, outreach_type, count_required')
        .eq('is_active', true);

      if (defsError) throw defsError;

      console.log('📋 [updateTaskCompletions] Task definitions:', taskDefs);

      const taskUpdates: Array<{id: string, completed: boolean, taskName: string}> = [];

      // Process each task definition using structured outreach_type and count_required
      taskDefs?.forEach(taskDef => {
        let shouldBeCompleted = false;
        
        // Check if task should be completed based on outreach_type and count_required
        if (taskDef.outreach_type) {
          const requiredCount = taskDef.count_required || 1;
          
          console.log(`📝 [updateTaskCompletions] Task "${taskDef.name}": type=${taskDef.outreach_type}, required=${requiredCount}`);
          
          switch (taskDef.outreach_type) {
            case 'cold':
              // For cold tasks, complete them sequentially based on name/order
              if (taskDef.name.includes('#1')) {
                shouldBeCompleted = counts.cold >= 1;
              } else if (taskDef.name.includes('#2')) {
                shouldBeCompleted = counts.cold >= 2;
              } else if (taskDef.name.includes('#3')) {
                shouldBeCompleted = counts.cold >= 3;
              } else {
                // Fallback for other cold tasks
                shouldBeCompleted = counts.cold >= requiredCount;
              }
              break;
            case 'warm':
              shouldBeCompleted = counts.warm >= requiredCount;
              break;
            case 'social':
              shouldBeCompleted = counts.social >= requiredCount;
              break;
          }
          
          console.log(`🎯 [updateTaskCompletions] Task "${taskDef.name}" should be completed: ${shouldBeCompleted}`);
        }

        taskUpdates.push({
          id: taskDef.id,
          completed: shouldBeCompleted,
          taskName: taskDef.name
        });
      });

      console.log('📝 [updateTaskCompletions] Task updates to process:', taskUpdates);

      // Update user tasks in batches for better performance
      const batchSize = 5;
      for (let i = 0; i < taskUpdates.length; i += batchSize) {
        const batch = taskUpdates.slice(i, i + batchSize);
        
        console.log(`🔄 [updateTaskCompletions] Processing batch ${i/batchSize + 1}:`, batch);
        
        await Promise.all(batch.map(async (update) => {
          try {
            console.log(`💾 [updateTaskCompletions] Updating task "${update.taskName}" to completed=${update.completed}`);
            
            const { error: updateError } = await supabase
              .from('user_daily_tasks')
              .update({
                completed: update.completed,
                completed_at: update.completed ? new Date().toISOString() : null,
                notes: update.completed ? `Auto-completed via outreach activity` : null
              })
              .eq('user_id', user.id)
              .eq('task_id', update.id)
              .eq('challenge_day', challengeDay);

            if (updateError) {
              console.error('❌ [updateTaskCompletions] Error updating task:', update.taskName, updateError);
            } else {
              console.log(`✅ [updateTaskCompletions] Successfully updated task "${update.taskName}"`);
            }
          } catch (error) {
            console.error('❌ [updateTaskCompletions] Error in task update batch:', error);
          }
        }));
      }
    } catch (error) {
      console.error('❌ [updateTaskCompletions] Error updating task completions:', error);
    }
  };

  // Add contact name to completed task notes
  const addContactToTaskNotes = async (outreachType: 'cold' | 'warm' | 'social', contactName: string, challengeDay?: number) => {
    if (!user?.id) return;

    try {
      const currentDay = challengeDay || await getCurrentChallengeDay();
      
      // Find tasks of the matching outreach type that are completed
      const { data: taskDefs, error: defsError } = await supabase
        .from('daily_tasks_definition')
        .select('id, name, outreach_type')
        .eq('is_active', true)
        .eq('outreach_type', outreachType);

      if (defsError) throw defsError;

      // Update notes for completed tasks of this type
      for (const taskDef of taskDefs || []) {
        const { data: userTask, error: fetchError } = await supabase
          .from('user_daily_tasks')
          .select('notes')
          .eq('user_id', user.id)
          .eq('task_id', taskDef.id)
          .eq('challenge_day', currentDay)
          .eq('completed', true)
          .single();

        if (fetchError) continue; // Task might not exist or not completed

        // Append contact name to existing notes
        const existingNotes = userTask.notes || 'Auto-completed via outreach activity';
        const contactNote = `\n• ${contactName}`;
        const updatedNotes = existingNotes.includes(contactName) 
          ? existingNotes 
          : existingNotes + contactNote;

        await supabase
          .from('user_daily_tasks')
          .update({ notes: updatedNotes })
          .eq('user_id', user.id)
          .eq('task_id', taskDef.id)
          .eq('challenge_day', currentDay);
      }
    } catch (error) {
      console.error('Error adding contact to task notes:', error);
    }
  };

  const reconcileOutreach = async (challengeDay?: number) => {
    if (!user?.id) {
      console.log('❌ [reconcileOutreach] No user authenticated');
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 [reconcileOutreach] Starting reconciliation...');
    setLoading(true);
    
    try {
      const currentDay = challengeDay || await getCurrentChallengeDay();
      console.log('📅 [reconcileOutreach] Challenge day:', currentDay);
      
      // Ensure tasks exist for this day
      console.log('✅ [reconcileOutreach] Ensuring daily tasks exist...');
      await ensureDailyTasksExist(currentDay);
      
      // Get outreach counts
      console.log('📊 [reconcileOutreach] Getting outreach counts...');
      const counts = await getOutreachCounts(currentDay);
      console.log('📊 [reconcileOutreach] Outreach counts:', counts);
      
      // Update task completions based on counts
      console.log('🔄 [reconcileOutreach] Updating task completions...');
      await updateTaskCompletions(currentDay, counts);
      console.log('✅ [reconcileOutreach] Task completions updated');
      
      toast({
        title: "Sync Complete",
        description: `Updated tasks for day ${currentDay}. Cold: ${counts.cold}, Warm: ${counts.warm}, Social: ${counts.social}`,
      });
      
      return { counts, challengeDay: currentDay };
    } catch (error) {
      console.error('❌ [reconcileOutreach] Error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync outreach data with tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    reconcileOutreach,
    getOutreachCounts,
    getCurrentChallengeDay,
    logOutreachActivity,
    addContactToTaskNotes,
    loading
  };
};