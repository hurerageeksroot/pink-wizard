import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
  company_name?: string;
  location?: string;
  show_in_leaderboard?: boolean;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  roles: string[];
  challenge_active?: boolean;
  challenge_joined_at?: string;
  challenge_days_completed?: number;
  challenge_progress?: number;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  total_contacts: number;
  total_activities: number;
  total_payments: number;
  active_challenges: number;
  recent_signups: number;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    total_users: 0,
    total_contacts: 0,
    total_activities: 0,
    total_payments: 0,
    active_challenges: 0,
    recent_signups: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && !loading) {
      fetchUsers();
    }
  }, [isAdmin, loading]);

  const checkAdminStatus = async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if current user has admin role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      const isAdminUser = !!userRoles;
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        await fetchAdminStats();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Use the new admin function that includes challenge data
      const { data, error } = await supabase.rpc('get_admin_users_with_challenge');

      if (error) throw error;
      
      const usersData: AdminUser[] = data?.map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        company_name: user.company_name,
        location: user.location,
        show_in_leaderboard: user.show_in_leaderboard,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        roles: user.roles || [],
        challenge_active: user.challenge_active,
        challenge_joined_at: user.challenge_joined_at,
        challenge_days_completed: user.challenge_days_completed,
        challenge_progress: user.challenge_progress
      })) || [];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchContentPages = async () => {
    // Content pages removed for simplification
    setContentPages([]);
  };

  const fetchAdminStats = async () => {
    try {
      // Use consolidated RPC function for efficiency
      const { data, error } = await supabase.rpc('get_admin_comprehensive_stats');
      
      if (error) throw error;

      const stats = data as any; // Type assertion for RPC result

      // Get precise challenge participant count using dedicated RPC
      const { data: participantCount, error: countError } = await supabase.rpc('get_active_challenge_participant_count');
      
      if (countError) {
        console.error('Error fetching participant count:', countError);
      }

      setAdminStats({
        total_users: stats.total_users || 0,
        total_contacts: stats.total_contacts || 0,
        total_activities: stats.total_activities || 0,
        total_payments: 0, // Not accessible from client
        active_challenges: participantCount || stats.active_challenge_participants || 0,
        recent_signups: stats.recent_signups || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user' | 'moderator', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role as any);
        if (error) throw error;
      }

      // Log removed for simplification

      await fetchUsers();
      toast({
        title: "Success",
        description: `User role ${action === 'add' ? 'added' : 'removed'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      // Call edge function to delete user with proper admin privileges
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId, userEmail }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchUsers();
      toast({
        title: "Success",
        description: "User account deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user account",
        variant: "destructive"
      });
    }
  };

  const createContentPage = async (pageData: Omit<ContentPage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .insert({
          ...pageData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log removed for simplification

      await fetchContentPages();
      toast({
        title: "Success",
        description: "Content page created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating content page:', error);
      toast({
        title: "Error",
        description: "Failed to create content page",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateContentPage = async (id: string, pageData: Partial<ContentPage>) => {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .update({
          ...pageData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log removed for simplification

      await fetchContentPages();
      toast({
        title: "Success",
        description: "Content page updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating content page:', error);
      toast({
        title: "Error",
        description: "Failed to update content page",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteContentPage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log removed for simplification

      await fetchContentPages();
      toast({
        title: "Success",
        description: "Content page deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content page:', error);
      toast({
        title: "Error",
        description: "Failed to delete content page",
        variant: "destructive"
      });
    }
  };


  const toggleUserChallenge = async (userId: string, enable: boolean) => {
    try {
      console.log(`[toggleUserChallenge] ${enable ? 'Enabling' : 'Disabling'} challenge for user:`, userId);
      
      // Optimistically update the UI first
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, challenge_active: enable }
            : user
        )
      );

      // Use the new safe admin function
      const { data, error } = await supabase.rpc('admin_toggle_user_challenge_safe', {
        p_target_user_id: userId,
        p_enable: enable
      });

      if (error) {
        console.error('[toggleUserChallenge] RPC error:', error);
        throw error;
      }
      
      console.log('[toggleUserChallenge] RPC success:', data);
      
      // Check if the operation was successful
      const success = (data as any)?.success === true;
      
      if (!success) {
        console.warn('[toggleUserChallenge] RPC returned failure');
        throw new Error((data as any)?.message || 'Failed to update challenge participation');
      }
      
      // Invalidate and refetch relevant queries to sync data
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipantCount'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipant', userId] });
      
      // Refresh the user list to get the latest state
      await fetchUsers();
      
      toast({
        title: "Success",
        description: (data as any)?.message || `Challenge participation ${enable ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('[toggleUserChallenge] Error:', error);
      
      // Revert optimistic update on error
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, challenge_active: !enable }
            : user
        )
      );
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update challenge participation",
        variant: "destructive"
      });
    }
  };

  return {
    users,
    contentPages,
    adminStats,
    loading,
    isAdmin,
    fetchUsers,
    fetchContentPages,
    fetchAdminStats,
    updateUserRole,
    deleteUser,
    createContentPage,
    updateContentPage,
    deleteContentPage,
    toggleUserChallenge,
    refreshData: fetchAdminStats
  };
};