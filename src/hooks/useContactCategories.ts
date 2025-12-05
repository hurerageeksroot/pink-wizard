import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactCategory, ContactCategoryCreate } from '@/types/contactCategory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useContactCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main query - seeds and fetches categories with shared cache
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['contactCategories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Seed categories and backfill contacts
      const { error: seedError } = await supabase.rpc('seed_user_categories_and_backfill', {
        user_id_param: user.id
      });
      
      if (seedError) {
        console.error('[useContactCategories] Error seeding categories:', seedError);
      }
      
      // Fetch categories
      const { data, error } = await supabase
        .from('user_contact_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at');
      
      if (error) throw error;
      
      return (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        label: cat.label,
        iconName: cat.icon_name,
        colorClass: cat.color_class,
        isDefault: cat.is_default,
        createdAt: new Date(cat.created_at),
        updatedAt: new Date(cat.updated_at),
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: ContactCategoryCreate) => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('user_contact_categories')
        .insert({
          user_id: user.id,
          name: categoryData.name.toLowerCase().replace(/\s+/g, '_'),
          label: categoryData.label,
          icon_name: categoryData.iconName || 'HelpCircle',
          color_class: categoryData.colorClass || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
          is_default: false,
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
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories', user?.id] });
      toast({ title: 'Success', description: 'Category added successfully' });
    },
    onError: (error) => {
      console.error('[useContactCategories] Error adding category:', error);
      toast({ title: 'Error', description: 'Failed to add category', variant: 'destructive' });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('No user');
      
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      if (!categoryToDelete) throw new Error('Category not found');
      
      if (categoryToDelete.name === 'uncategorized') {
        throw new Error('Cannot delete uncategorized');
      }
      
      // Check and update contacts
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', categoryToDelete.name);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ category: 'uncategorized' })
          .eq('user_id', user.id)
          .eq('category', categoryToDelete.name);
        
        if (updateError) throw updateError;
      }
      
      // Delete category
      const { error } = await supabase
        .from('user_contact_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return { count };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contactCategories', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['crmData', user?.id] }); // Contacts updated
      
      const contactMessage = data.count && data.count > 0 
        ? ` ${data.count} contact${data.count === 1 ? '' : 's'} moved to "Uncategorized".` 
        : '';
      
      toast({ 
        title: 'Success', 
        description: `Category deleted successfully.${contactMessage}` 
      });
    },
    onError: (error: any) => {
      if (error.message === 'Cannot delete uncategorized') {
        toast({
          title: 'Cannot Delete',
          description: 'The "Uncategorized" category cannot be deleted',
          variant: 'destructive',
        });
      } else {
        console.error('[useContactCategories] Error deleting category:', error);
        toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
      }
    },
  });

  // Helper functions
  const getCategoryByName = (name: string) => {
    return categories.find(cat => cat.name === name);
  };

  const getContactCountForCategory = async (categoryName: string) => {
    if (!user) return 0;
    
    try {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', categoryName);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('[useContactCategories] Error getting contact count:', error);
      return 0;
    }
  };

  // Public API (same interface as before - no breaking changes)
  return {
    categories,
    loading,
    addCategory: (categoryData: ContactCategoryCreate) => addCategoryMutation.mutateAsync(categoryData),
    deleteCategory: (categoryId: string) => deleteCategoryMutation.mutateAsync(categoryId),
    getCategoryByName,
    getContactCountForCategory,
    reload: () => queryClient.invalidateQueries({ queryKey: ['contactCategories', user?.id] }),
  };
}
