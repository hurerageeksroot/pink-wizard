import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      user_points_ledger: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          points_earned: number
          description: string | null
          metadata: any
          challenge_day: number | null
          created_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Starting milestone bonus check...');
    
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('👤 Checking bonuses for user:', userId);

    // Get user's total points
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points_ledger')
      .select('points_earned')
      .eq('user_id', userId);

    if (pointsError) {
      console.error('❌ Error fetching points:', pointsError);
      throw pointsError;
    }

    const totalPoints = pointsData?.reduce((sum, entry) => sum + entry.points_earned, 0) || 0;
    console.log('📊 Current total points:', totalPoints);

    // Check if user has already received milestone bonuses
    const { data: existingBonuses, error: bonusError } = await supabase
      .from('user_points_ledger')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'milestone_bonus');

    if (bonusError) {
      console.error('❌ Error fetching existing bonuses:', bonusError);
      throw bonusError;
    }

    const milestoneLevels = [500, 1000, 2500, 5000, 10000];
    const bonusAmounts = [100, 150, 250, 500, 1000];
    const awardedBonuses = [];

    for (let i = 0; i < milestoneLevels.length; i++) {
      const milestone = milestoneLevels[i];
      const bonus = bonusAmounts[i];
      
      // Check if user has reached this milestone
      if (totalPoints >= milestone) {
        // Check if bonus already awarded for this milestone using metadata
        const alreadyAwarded = existingBonuses?.some(
          b => b.metadata?.milestone_level === milestone
        );
        
        if (!alreadyAwarded) {
          console.log(`🎉 Awarding ${bonus} bonus points for ${milestone} milestone!`);
          
          // Use conflict-safe insert for milestone bonus
          const { data: insertData, error: insertError } = await supabase
            .from('user_points_ledger')
            .insert({
              user_id: userId,
              activity_type: 'milestone_bonus',
              points_earned: bonus,
              description: `Milestone bonus for reaching ${milestone} points!`,
              metadata: {
                milestone_level: milestone,
                bonus_type: 'points_milestone',
                awarded_at: new Date().toISOString(),
                conflict_safe: true
              }
            })
            .select()
            .single();

          if (insertError) {
            // Check if it's a unique constraint violation (already awarded)
            if (insertError.code === '23505' && insertError.message.includes('unique_milestone_bonus')) {
              console.log(`ℹ️ Milestone ${milestone} bonus already awarded for user ${userId}`);
            } else {
              console.error(`❌ Error awarding ${milestone} milestone bonus:`, insertError);
            }
          } else if (insertData) {
            awardedBonuses.push({
              milestone,
              bonus,
              description: `Congratulations! You've reached ${milestone} points and earned a ${bonus} point bonus!`
            });
          }
        }
      }
    }


    console.log('✅ Milestone check complete. Bonuses awarded:', awardedBonuses.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPoints,
        bonusesAwarded: awardedBonuses,
        message: awardedBonuses.length > 0 
          ? `Congratulations! You've earned ${awardedBonuses.length} bonus reward(s)!`
          : 'No new bonuses to award at this time.'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in milestone bonus check:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});