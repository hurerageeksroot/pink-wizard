import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface RelationshipCategoryPreference {
  id: string;
  user_id: string;
  category_name: string;
  category_label: string;
  is_enabled: boolean;
  display_order: number;
  custom_color_class?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryConfig {
  name: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  icon: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    name: 'business',
    label: 'Business',
    description: 'Professional contacts, leads, and business relationships',
    defaultEnabled: true,
    icon: 'Briefcase'
  },
  {
    name: 'personal',
    label: 'Personal',
    description: 'Friends, family, and personal connections',
    defaultEnabled: true,
    icon: 'Heart'
  },
  {
    name: 'service_provider',
    label: 'Service Provider/Vendor',
    description: 'Service providers, vendors, and business suppliers',
    defaultEnabled: true,
    icon: 'Shield'
  },
  {
    name: 'other_misc',
    label: 'Other / Misc',
    description: 'General contacts that don\'t fit other categories',
    defaultEnabled: true,
    icon: 'User'
  },
  {
    name: 'civic_community',
    label: 'Civic & Community',
    description: 'Local leaders, community members, and civic organizations',
    defaultEnabled: false,
    icon: 'Building'
  },
  {
    name: 'philanthropy_nonprofit',
    label: 'Philanthropy & Nonprofits',
    description: 'Charitable organizations, donors, and nonprofit contacts',
    defaultEnabled: false,
    icon: 'Heart'
  },
  {
    name: 'media_press',
    label: 'Media & Press',
    description: 'Journalists, bloggers, influencers, and media contacts',
    defaultEnabled: false,
    icon: 'Newspaper'
  }
];

const categoryPreferencesKeys = {
  all: ['categoryPreferences'] as const,
  user: (userId: string) => [...categoryPreferencesKeys.all, userId] as const,
};

async function fetchCategoryPreferences(userId: string): Promise<RelationshipCategoryPreference[]> {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('user_relationship_category_preferences')
    .select('*')
    .eq('user_id', userId)
    .order('display_order');

  if (error) throw error;

  // If no preferences exist, initialize with defaults
  if (!data || data.length === 0) {
    await supabase.rpc('initialize_default_relationship_categories', {
      p_user_id: userId
    });

    // Fetch again after initialization
    const { data: newData, error: newError } = await supabase
      .from('user_relationship_category_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('display_order');

    if (newError) throw newError;
    return newData || [];
  }

  return data;
}

export function useRelationshipCategoryPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: categoryPreferences = [],
    isLoading,
    error
  } = useQuery({
    queryKey: categoryPreferencesKeys.user(user?.id || ''),
    queryFn: () => fetchCategoryPreferences(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryName, isEnabled, customColorClass }: {
      categoryName: string;
      isEnabled?: boolean;
      customColorClass?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updates: any = { updated_at: new Date().toISOString() };
      if (isEnabled !== undefined) updates.is_enabled = isEnabled;
      if (customColorClass !== undefined) updates.custom_color_class = customColorClass;

      const { error } = await supabase
        .from('user_relationship_category_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .eq('category_name', categoryName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryPreferencesKeys.user(user?.id || '') });
      // Also invalidate relationship types since they depend on category preferences
      queryClient.invalidateQueries({ queryKey: ['relationshipTypes'] });
    },
    onError: (error) => {
      console.error('Failed to update category preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category preference',
        variant: 'destructive'
      });
    }
  });

  const enableCategoriesMutation = useMutation({
    mutationFn: async (categoryNames: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, enable the categories
      const { error: updateError } = await supabase
        .from('user_relationship_category_preferences')
        .update({ is_enabled: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('category_name', categoryNames);

      if (updateError) throw updateError;

      // Then, seed the relationship types for each enabled category
      const seedResults = await Promise.all(
        categoryNames.map(async (categoryName) => {
          const { data, error } = await supabase.rpc('seed_relationship_types_for_category', {
            p_user_id: user.id,
            p_category_name: categoryName
          });
          
          if (error) {
            console.error(`Failed to seed types for ${categoryName}:`, error);
            return 0;
          }
          return data || 0;
        })
      );

      const totalSeeded = seedResults.reduce((sum, count) => sum + count, 0);
      console.log(`Seeded ${totalSeeded} relationship types for enabled categories`);

      return totalSeeded;
    },
    onSuccess: (typesSeeded) => {
      queryClient.invalidateQueries({ queryKey: categoryPreferencesKeys.user(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: ['relationshipTypes'] });
      
      const message = typesSeeded > 0
        ? `Categories enabled and ${typesSeeded} relationship type${typesSeeded !== 1 ? 's' : ''} added`
        : 'Categories enabled successfully';
      
      toast({
        title: 'Success',
        description: message
      });
    },
    onError: (error) => {
      console.error('Failed to enable categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable categories',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const getEnabledCategories = () => categoryPreferences.filter(pref => pref.is_enabled);
  const getDisabledCategories = () => categoryPreferences.filter(pref => !pref.is_enabled);
  const isCategoryEnabled = (categoryName: string) => 
    categoryPreferences.find(pref => pref.category_name === categoryName)?.is_enabled ?? false;
  
  const getCategoryConfig = (categoryName: string) => 
    CATEGORY_CONFIGS.find(config => config.name === categoryName);

  const getAvailableCategories = () => CATEGORY_CONFIGS.filter(config => 
    !isCategoryEnabled(config.name)
  );

  return {
    categoryPreferences,
    loading: isLoading,
    error,
    enabledCategories: getEnabledCategories(),
    disabledCategories: getDisabledCategories(),
    availableCategories: getAvailableCategories(),
    updateCategory: updateCategoryMutation.mutate,
    enableCategories: enableCategoriesMutation.mutate,
    isCategoryEnabled,
    getCategoryConfig,
    isUpdating: updateCategoryMutation.isPending || enableCategoriesMutation.isPending
  };
}