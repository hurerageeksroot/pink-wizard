import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hook to handle client-side email sequence triggers
export function useEmailSequenceTriggers() {
  
  // Function to trigger challenge start sequence
  const triggerChallengeStart = async (userId: string) => {
    try {
      console.log('Triggering challenge start sequence for user:', userId);
      
      // Check if user is a challenge participant
      const { data: challengeParticipant } = await supabase
        .from('user_challenge_progress')
        .select('is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      // Only trigger for challenge participants
      if (!challengeParticipant) {
        console.log('User is not a challenge participant, skipping challenge start sequence');
        return;
      }
      
      // Get user email from profiles/auth
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
        
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        await supabase.rpc('trigger_email_sequence', {
          p_trigger_event: 'challenge_start',
          p_user_id: userId,
          p_user_email: user.email,
          p_variables: {
            user_name: profile?.display_name || 'there',
            challenge_name: '75 Hard Challenge'
          }
        });
      }
    } catch (error) {
      console.error('Error triggering challenge start sequence:', error);
    }
  };

  // Function to trigger challenge complete sequence
  const triggerChallengeComplete = async (userId: string) => {
    try {
      console.log('Triggering challenge complete sequence for user:', userId);
      
      // Check if user is a challenge participant
      const { data: challengeParticipant } = await supabase
        .from('user_challenge_progress')
        .select('is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      // Only trigger for challenge participants
      if (!challengeParticipant) {
        console.log('User is not a challenge participant, skipping challenge complete sequence');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
        
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        await supabase.rpc('trigger_email_sequence', {
          p_trigger_event: 'challenge_complete',
          p_user_id: userId,
          p_user_email: user.email,
          p_variables: {
            user_name: profile?.display_name || 'there',
            challenge_name: '75 Hard Challenge',
            completion_date: new Date().toLocaleDateString()
          }
        });
      }
    } catch (error) {
      console.error('Error triggering challenge complete sequence:', error);
    }
  };

  return {
    triggerChallengeStart,
    triggerChallengeComplete
  };
}