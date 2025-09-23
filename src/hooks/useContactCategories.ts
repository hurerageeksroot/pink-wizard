import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContactCategory, ContactCategoryCreate } from '@/types/contactCategory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useContactCategories() {
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadCategories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First, ensure categories are seeded and contacts are backfilled
      const { error: seedError } = await supabase.rpc('seed_user_categories_and_backfill', {
        user_id_param: user.id
      });

      if (seedError) {
        console.error('Error seeding categories:', seedError);
      }

      // Now fetch the categories
      const { data, error } = await supabase
        .from('user_contact_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at');

      if (error) throw error;

      const formattedCategories: ContactCategory[] = (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        label: cat.label,
        iconName: cat.icon_name,
        colorClass: cat.color_class,
        isDefault: cat.is_default,
        createdAt: new Date(cat.created_at),
        updatedAt: new Date(cat.updated_at),
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contact categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData: ContactCategoryCreate) => {
    if (!user) return null;

    try {
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

      const newCategory: ContactCategory = {
        id: data.id,
        name: data.name,
        label: data.label,
        iconName: data.icon_name,
        colorClass: data.color_class,
        isDefault: data.is_default,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setCategories(prev => [...prev, newCategory]);
      
      toast({
        title: 'Success',
        description: 'Category added successfully',
      });

      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return false;

    try {
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      if (!categoryToDelete) return false;

      // Prevent deletion of uncategorized
      if (categoryToDelete.name === 'uncategorized') {
        toast({
          title: 'Cannot Delete',
          description: 'The "Uncategorized" category cannot be deleted',
          variant: 'destructive',
        });
        return false;
      }

      // Check how many contacts use this category
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', categoryToDelete.name);

      if (countError) throw countError;

      // Update all contacts with this category to 'uncategorized'
      if (count && count > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ category: 'uncategorized' })
          .eq('user_id', user.id)
          .eq('category', categoryToDelete.name);

        if (updateError) throw updateError;
      }

      // Delete the category
      const { error } = await supabase
        .from('user_contact_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      const contactMessage = count && count > 0 
        ? ` ${count} contact${count === 1 ? '' : 's'} moved to "Uncategorized".` 
        : '';
      
      toast({
        title: 'Success', 
        description: `Category deleted successfully.${contactMessage}`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
      return false;
    }
  };

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
      console.error('Error getting contact count:', error);
      return 0;
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    getCategoryByName,
    getContactCountForCategory,
    reload: loadCategories,
  };
}