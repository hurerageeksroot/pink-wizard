import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { seedSampleDataForUser } from '@/utils/seedData';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Removed excessive console logging to reduce noise

  useEffect(() => {
    let mounted = true;
    
    // Add loading timeout protection
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log(`[Auth] Auth state changed: ${event}`, session?.user?.email || 'No user');
        
        // Add diagnostics for session events
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out - could be manual or session collision');
        } else if (event === 'SIGNED_IN') {
          console.log('[Auth] User signed in successfully');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(loadingTimeout);

        // Defer async operations to avoid deadlock
        if (event === 'SIGNED_IN' && session?.user?.email) {
          console.log('[Auth] User signed in, starting post-signin setup for:', session.user.email);
          setTimeout(async () => {
            try {
              await seedSampleDataForUser(session.user.id, session.user.email!);
              // No auto-trial creation - trials must be explicitly started by user action
              console.log('[Auth] Post-signin setup completed for:', session.user.email);
            } catch (error) {
              console.error('[Auth] Error in post-signin setup:', error);
            }
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('[Auth] Initial session check:', session?.user?.email || 'No session');
      
      // Only update state if we don't have a session from the auth state listener yet
      // This prevents the race condition where getSession completes before onAuthStateChange
      setSession(session);
      setUser(session?.user ?? null);
      
      // Only set loading to false if we have a definitive result
      setLoading(false);
      clearTimeout(loadingTimeout);
    }).catch((error) => {
      if (!mounted) return;
      console.error('[Auth] Error getting session:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    // Use current domain for redirects instead of hardcoded URL
    const redirectUrl = `${window.location.origin}/`;
    
    const userData: any = {
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    };

    // Add name metadata if provided
    if (firstName || lastName) {
      userData.options.data = {
        first_name: firstName,
        last_name: lastName
      };
    }
    
    const { data, error } = await supabase.auth.signUp(userData);
    
    // Don't start trial here - let the auth state change handler do it
    // This avoids duplicate trial creation attempts
    
    return { error };
  };

  const signOut = async () => {
    console.log('[useAuth] signOut called - local scope logout');
    try {
      // Force clear local session first
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut(); // Local scope only
      console.log('[useAuth] signOut result:', { error });
      
      return { error };
    } catch (err) {
      console.error('[useAuth] signOut exception:', err);
      // Force logout anyway
      setUser(null);
      setSession(null);
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    // Use current domain for redirects instead of hardcoded URL
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};