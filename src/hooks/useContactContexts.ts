import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactContextData, ContactContextCreate } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useContactContexts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main query - seeds and fetches contexts with shared cache
  const { data: contexts = [], isLoading: loading } = useQuery({
    queryKey: ['contactContexts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Seed default contexts
      const { error: seedError } = await supabase.rpc('seed_default_contact_contexts', {
        p_user_id: user.id
      });
      
      if (seedError) {
        console.error('[useContactContexts] Error seeding contexts:', seedError);
      }
      
      // Fetch contexts
      const { data, error } = await supabase
        .from('contact_contexts')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (error) throw error;
      
      return (data || []).map(ctx => ({
        id: ctx.id,
        name: ctx.name,
        label: ctx.label,
        iconName: ctx.icon_name,
        colorClass: ctx.color_class,
        isDefault: ctx.is_default,
        sortOrder: ctx.sort_order,
        createdAt: new Date(ctx.created_at),
        updatedAt: new Date(ctx.updated_at),
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Add context mutation
  const addContextMutation = useMutation({
    mutationFn: async (contextData: ContactContextCreate) => {
      if (!user) throw new Error('No user');
      
      const maxSortOrder = Math.max(...contexts.map(ctx => ctx.sortOrder), 0);
      
      const { data, error } = await supabase
        .from('contact_contexts')
        .insert({
          user_id: user.id,
          name: contextData.name.toLowerCase().replace(/\s+/g, '_'),
          label: contextData.label,
          icon_name: contextData.iconName || 'Tag',
          color_class: contextData.colorClass || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
          is_default: false,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        label: data.label,
        iconName: data.icon_name,
        colorClass: data.color_class,
        isDefault: data.is_default,
        sortOrder: data.sort_order,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactContexts', user?.id] });
      toast({ title: 'Success', description: 'Context added successfully' });
    },
    onError: (error) => {
      console.error('[useContactContexts] Error adding context:', error);
      toast({ title: 'Error', description: 'Failed to add context', variant: 'destructive' });
    },
  });

  // Delete context mutation
  const deleteContextMutation = useMutation({
    mutationFn: async (contextId: string) => {
      if (!user) throw new Error('No user');
      
      const contextToDelete = contexts.find(ctx => ctx.id === contextId);
      if (!contextToDelete) throw new Error('Context not found');
      
      if (contextToDelete.isDefault) {
        throw new Error('Cannot delete default context');
      }
      
      // Remove assignments
      const { error: assignmentError } = await supabase
        .from('contact_context_assignments')
        .delete()
        .eq('context_id', contextId);
      
      if (assignmentError) throw assignmentError;
      
      // Delete context
      const { error } = await supabase
        .from('contact_contexts')
        .delete()
        .eq('id', contextId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactContexts', user?.id] });
      toast({ title: 'Success', description: 'Context deleted successfully' });
    },
    onError: (error: any) => {
      if (error.message === 'Cannot delete default context') {
        toast({
          title: 'Cannot Delete',
          description: 'Default contexts cannot be deleted',
          variant: 'destructive',
        });
      } else {
        console.error('[useContactContexts] Error deleting context:', error);
        toast({ title: 'Error', description: 'Failed to delete context', variant: 'destructive' });
      }
    },
  });

  // Assign context mutation
  const assignContextMutation = useMutation({
    mutationFn: async ({ contactId, contextId }: { contactId: string; contextId: string }) => {
      const { error } = await supabase
        .from('contact_context_assignments')
        .insert({ contact_id: contactId, context_id: contextId });
      
      if (error) throw error;
      return { contactId, contextId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contactContexts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crmData', user?.id] });
      
      const context = contexts.find(c => c.id === data.contextId);
      toast({ 
        title: 'Tag Added', 
        description: `"${context?.label || 'Tag'}" has been added to this contact` 
      });
    },
    onError: (error: any) => {
      console.error('[useContactContexts] Error assigning context:', error);
      const message = error.message?.includes('duplicate') 
        ? 'This tag is already assigned to the contact'
        : 'Failed to add tag to contact';
      toast({ 
        title: 'Error', 
        description: message,
        variant: 'destructive' 
      });
    },
  });

  // Remove context mutation
  const removeContextMutation = useMutation({
    mutationFn: async ({ contactId, contextId }: { contactId: string; contextId: string }) => {
      const { error } = await supabase
        .from('contact_context_assignments')
        .delete()
        .eq('contact_id', contactId)
        .eq('context_id', contextId);
      
      if (error) throw error;
      return { contactId, contextId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contactContexts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crmData', user?.id] });
      
      const context = contexts.find(c => c.id === data.contextId);
      toast({ 
        title: 'Tag Removed', 
        description: `"${context?.label || 'Tag'}" has been removed from this contact` 
      });
    },
    onError: (error) => {
      console.error('[useContactContexts] Error removing context:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to remove tag from contact',
        variant: 'destructive' 
      });
    },
  });

  // Helper functions
  const getContextByName = (name: string) => {
    return contexts.find(ctx => ctx.name === name);
  };

  const getContactContexts = async (contactId: string): Promise<ContactContextData[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('contact_context_assignments')
        .select(`
          context_id,
          contact_contexts (
            id, name, label, icon_name, color_class, is_default, sort_order, created_at, updated_at
          )
        `)
        .eq('contact_id', contactId);
      
      if (error) throw error;
      
      return (data || []).map((assignment: any) => ({
        id: assignment.contact_contexts.id,
        name: assignment.contact_contexts.name,
        label: assignment.contact_contexts.label,
        iconName: assignment.contact_contexts.icon_name,
        colorClass: assignment.contact_contexts.color_class,
        isDefault: assignment.contact_contexts.is_default,
        sortOrder: assignment.contact_contexts.sort_order,
        createdAt: new Date(assignment.contact_contexts.created_at),
        updatedAt: new Date(assignment.contact_contexts.updated_at),
      }));
    } catch (error) {
      console.error('[useContactContexts] Error getting contact contexts:', error);
      return [];
    }
  };

  // Public API (same interface as before - no breaking changes)
  return {
    contexts,
    loading,
    addContext: (contextData: ContactContextCreate) => addContextMutation.mutateAsync(contextData),
    deleteContext: (contextId: string) => deleteContextMutation.mutateAsync(contextId),
    getContextByName,
    assignContextToContact: async (contactId: string, contextId: string) => {
      try {
        await assignContextMutation.mutateAsync({ contactId, contextId });
        return true;
      } catch (error) {
        console.error('[assignContextToContact] Failed:', error);
        // Error toast is already handled by the mutation's onError
        return false;
      }
    },
    removeContextFromContact: async (contactId: string, contextId: string) => {
      try {
        await removeContextMutation.mutateAsync({ contactId, contextId });
        return true;
      } catch (error) {
        console.error('[removeContextFromContact] Failed:', error);
        // Error toast is already handled by the mutation's onError
        return false;
      }
    },
    getContactContexts,
    reload: () => queryClient.invalidateQueries({ queryKey: ['contactContexts', user?.id] }),
  };
}
