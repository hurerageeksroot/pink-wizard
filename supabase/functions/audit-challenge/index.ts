import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Get user from JWT and verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing user' }),
        { status: 401, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin', { user_id_param: userData.user.id });
    if (adminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    const { dryRun = true, enrollMissingParticipants = false } = await req.json().catch(() => ({ dryRun: true, enrollMissingParticipants: false }));

    const results: AuditResults = {
      currentDay: 0,
      activeParticipants: 0,
      missingDailyTasks: 0,
      participantsWithZeroPoints: 0,
      participantsWithoutAnyTasks: 0,
      participantsMissingDay1: 0,
      participantsMissingDay1List: [],
      participantsWithoutAnyTasksList: [],
      tasksBackfilled: 0,
      tasksCreated: 0,
      tasksCompleted: 0,
      bonusesAwarded: 0,
      eligibleNotEnrolled: 0,
      enrolledByAudit: 0,
      errors: []
    };

    // Get current challenge config
    const { data: challengeConfig, error: challengeError } = await supabase
      .from('challenge_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (challengeError || !challengeConfig) {
      results.errors.push('No active challenge found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          results,
          errors: results.errors,
          dryRun: dryRun 
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Calculate current day from dates using UTC midnight normalization
    const startDate = new Date(challengeConfig.start_date + 'T00:00:00Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = Math.max(1, Math.min(diffDays + 1, challengeConfig.total_days));
    results.currentDay = currentDay;

    // Update the challenge config current_day if not dry run
    if (!dryRun && challengeConfig.current_day !== currentDay) {
      await supabase
        .from('challenge_config')
        .update({ current_day: currentDay })
        .eq('id', challengeConfig.id);
    }

    // Get active participants (distinct users only)
    const { data: participantData, error: participantsError } = await supabase
      .from('user_challenge_progress')
      .select('user_id')
      .eq('is_active', true);

    if (participantsError) {
      results.errors.push(`Error fetching participants: ${participantsError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          results,
          errors: results.errors,
          dryRun: dryRun 
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Ensure we only work with distinct users (in case of duplicates)
    const uniqueUserIds = [...new Set(participantData?.map(p => p.user_id) || [])];
    const participants = uniqueUserIds.map(user_id => ({ user_id }));
    results.activeParticipants = participants.length;

    // Get active daily task definitions
    const { data: taskDefinitions, error: taskDefError } = await supabase
      .from('daily_tasks_definition')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (taskDefError) {
      results.errors.push(`Error fetching task definitions: ${taskDefError.message}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          results,
          errors: results.errors,
          dryRun: dryRun 
        }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Optional: Enroll eligible users who aren't participants yet
    if (enrollMissingParticipants) {
      const participantIds = participants.map(p => p.user_id);
      
      let eligibleQuery = supabase
        .from('profiles')
        .select('id');
      
      // Only add the NOT IN clause if there are participants to exclude
      if (participantIds.length > 0) {
        const inList = `(${participantIds.join(',')})`;
        eligibleQuery = eligibleQuery.not('id', 'in', inList);
      }
      
      const { data: eligibleUsers, error: eligibleError } = await eligibleQuery;

      if (eligibleError) {
        results.errors.push(`Error fetching eligible users: ${eligibleError.message}`);
      } else if (eligibleUsers && eligibleUsers.length > 0) {
        results.eligibleNotEnrolled = eligibleUsers.length;
        
        if (!dryRun) {
          const enrollments = eligibleUsers.map(user => ({
            user_id: user.id,
            is_active: true,
            joined_at: new Date().toISOString()
          }));

          const { error: enrollError } = await supabase
            .from('user_challenge_progress')
            .insert(enrollments);

          if (enrollError) {
            results.errors.push(`Error enrolling users: ${enrollError.message}`);
          } else {
            results.enrolledByAudit = eligibleUsers.length;
            // Add newly enrolled users to participants list
            participants.push(...eligibleUsers.map(u => ({ user_id: u.id })));
            results.activeParticipants = participants.length;
          }
        }
      }
    }

    // Check for missing daily tasks and participants with zero points
    for (const participant of participants) {
      // Check if participant has ANY daily tasks at all
      const { data: allUserTasks, error: allTasksError } = await supabase
        .from('user_daily_tasks')
        .select('challenge_day')
        .eq('user_id', participant.user_id);

      if (allTasksError) {
        results.errors.push(`Error checking all tasks for user ${participant.user_id}: ${allTasksError.message}`);
        continue;
      }

      const userHasAnyTasks = allUserTasks && allUserTasks.length > 0;
      if (!userHasAnyTasks) {
        results.participantsWithoutAnyTasks++;
        results.participantsWithoutAnyTasksList.push(participant.user_id);
      }

      // Check if participant has Day 1 tasks
      const userHasDay1Tasks = allUserTasks?.some(task => task.challenge_day === 1);
      if (!userHasDay1Tasks) {
        results.participantsMissingDay1++;
        results.participantsMissingDay1List.push(participant.user_id);
      }

      // Backfill missing tasks for all days from 1 to current day
      const existingDays = new Set(allUserTasks?.map(t => t.challenge_day) || []);
      let tasksBackfilledForUser = 0;

      for (let day = 1; day <= currentDay; day++) {
        if (!existingDays.has(day)) {
          // Create all task definitions for this missing day
          if (!dryRun) {
            const tasksToCreate = taskDefinitions.map(task => ({
              user_id: participant.user_id,
              challenge_day: day,
              task_id: task.id,
              completed: false
            }));

            const { error: createTasksError } = await supabase
              .from('user_daily_tasks')
              .insert(tasksToCreate);

            if (createTasksError) {
              results.errors.push(`Error creating tasks for user ${participant.user_id}, day ${day}: ${createTasksError.message}`);
            } else {
              tasksBackfilledForUser += tasksToCreate.length;
            }
          } else {
            // In dry run, just count what would be created
            tasksBackfilledForUser += taskDefinitions.length;
          }
        }
      }

      results.tasksBackfilled += tasksBackfilledForUser;

      // Check current day tasks specifically for missing count
      const { data: currentDayTasks, error: currentDayError } = await supabase
        .from('user_daily_tasks')
        .select('task_id')
        .eq('user_id', participant.user_id)
        .eq('challenge_day', currentDay);

      if (currentDayError) {
        results.errors.push(`Error checking current day tasks for user ${participant.user_id}: ${currentDayError.message}`);
        continue;
      }

      const existingCurrentDayTaskIds = new Set(currentDayTasks?.map(t => t.task_id) || []);
      const missingCurrentDayTasks = taskDefinitions.filter(def => !existingCurrentDayTaskIds.has(def.id));
      
      results.missingDailyTasks += missingCurrentDayTasks.length;

      // Create missing current day tasks if not dry run (these should be rare now due to backfill)
      if (!dryRun && missingCurrentDayTasks.length > 0) {
        const tasksToCreate = missingCurrentDayTasks.map(task => ({
          user_id: participant.user_id,
          challenge_day: currentDay,
          task_id: task.id,
          completed: false
        }));

        const { error: createTasksError } = await supabase
          .from('user_daily_tasks')
          .insert(tasksToCreate);

        if (createTasksError) {
          results.errors.push(`Error creating current day tasks for user ${participant.user_id}: ${createTasksError.message}`);
        } else {
          results.tasksCreated += tasksToCreate.length;
        }
      }

      // Check points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points_ledger')
        .select('points_earned')
        .eq('user_id', participant.user_id);

      if (pointsError) {
        results.errors.push(`Error checking points for user ${participant.user_id}: ${pointsError.message}`);
        continue;
      }

      const totalPoints = pointsData.reduce((sum, entry) => sum + entry.points_earned, 0);
      if (totalPoints === 0) {
        results.participantsWithZeroPoints++;
      }

      // Update task completions based on outreach counts if not dry run
      if (!dryRun) {
        // Get outreach activity counts for current day using UTC boundaries
        const dayStart = new Date();
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date();
        dayEnd.setUTCHours(24, 0, 0, 0);
        
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('type')
          .eq('user_id', participant.user_id)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        if (!activitiesError && activitiesData) {
          const outreachCounts = {
            cold_outreach: activitiesData.filter(a => a.type === 'cold_outreach').length,
            warm_outreach: activitiesData.filter(a => a.type === 'warm_outreach').length,
            social_outreach: activitiesData.filter(a => a.type === 'social_outreach').length,
            follow_up: activitiesData.filter(a => a.type === 'follow_up').length,
            email: activitiesData.filter(a => a.type === 'email').length,
            phone_call: activitiesData.filter(a => a.type === 'phone_call').length,
            meeting: activitiesData.filter(a => a.type === 'meeting').length
          };

          // Update task completions based on outreach type requirements
          for (const taskDef of taskDefinitions) {
            if (taskDef.outreach_type && outreachCounts[taskDef.outreach_type] >= taskDef.count_required) {
              const { error: updateError } = await supabase
                .from('user_daily_tasks')
                .update({ completed: true, completed_at: new Date().toISOString() })
                .eq('user_id', participant.user_id)
                .eq('challenge_day', currentDay)
                .eq('task_id', taskDef.id)
                .eq('completed', false);

              if (!updateError) {
                results.tasksCompleted++;
              }
            }
          }
        }

        // Check and award performance bonuses
        try {
          await supabase.rpc('check_performance_bonuses', { p_user_id: participant.user_id });
          results.bonusesAwarded++;
        } catch (error) {
          // Bonus already awarded or other error - not critical
        }
      }
    }

    // Update leaderboard stats if not dry run
    if (!dryRun) {
      const { error: leaderboardError } = await supabase.rpc('update_leaderboard_stats');
      if (leaderboardError) {
        results.errors.push(`Error updating leaderboard: ${leaderboardError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        dryRun,
        message: dryRun ? 'Audit completed (dry-run)' : 'Audit completed and fixes applied'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'content-type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Audit challenge error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        results: {
          currentDay: 0,
          activeParticipants: 0,
          missingDailyTasks: 0,
          participantsWithZeroPoints: 0,
          participantsWithoutAnyTasks: 0,
          participantsMissingDay1: 0,
          participantsMissingDay1List: [],
          participantsWithoutAnyTasksList: [],
          tasksBackfilled: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          bonusesAwarded: 0,
          eligibleNotEnrolled: 0,
          enrolledByAudit: 0,
          errors: [`Unexpected error: ${error.message}`]
        },
        errors: [`Unexpected error: ${error.message}`],
        dryRun: true
      }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
    );
  }
});