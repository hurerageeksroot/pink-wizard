import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRelationshipTypesQuery, relationshipTypesKeys } from './useRelationshipTypesQuery';
import { useRelationshipCategoryPreferences } from './useRelationshipCategoryPreferences';
import { 
  RelationshipIntent, 
  RelationshipStatus, 
  EnhancedRelationshipTypeData,
  EnhancedRelationshipTypeCreate,
  RelationshipIntentConfig,
} from '@/types/crm';
import { toast } from 'sonner';
import { useMemo, useCallback } from 'react';

// Database-backed relationship intent configurations
interface DatabaseRelationshipIntentConfig {
  id: string;
  intent: string;
  label: string;
  description?: string;
  icon_name: string;
  color_class: string;
  default_status: string;
}

interface DatabaseRelationshipStatusOption {
  id: string;
  intent: string;
  status_key: string;
  label: string;
  description?: string;
  color_class: string;
  is_terminal: boolean;
  sort_order: number;
}

// Status configurations for each relationship intent - UPDATED FOR NEW INTENT STRUCTURE
export const RELATIONSHIP_INTENT_CONFIGS: Record<RelationshipIntent, RelationshipIntentConfig> = {
  business_lead_statuses: {
    label: 'Business Lead',
    description: 'Potential client relationships requiring cultivation',
    iconName: 'Target',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-200',
    defaultStatus: 'cold',
    statusOptions: {
      cold: { label: 'Cold', description: 'Initial outreach stage', colorClass: 'bg-blue-100 text-blue-800' },
      warm: { label: 'Warm', description: 'Engaged and interested', colorClass: 'bg-yellow-100 text-yellow-800' },
      hot: { label: 'Hot', description: 'Ready to close', colorClass: 'bg-red-100 text-red-800' },
      won: { label: 'Won', description: 'Successfully closed', colorClass: 'bg-green-100 text-green-800', isTerminal: true },
      'lost - not a fit': { label: 'Lost - Not a Fit', description: 'Not a good match', colorClass: 'bg-gray-100 text-gray-800', isTerminal: true },
      'lost - maybe later': { label: 'Lost - Maybe Later', description: 'Not now but potential future', colorClass: 'bg-gray-100 text-gray-800', isTerminal: true },
    }
  },
  business_nurture_statuses: {
    label: 'Business Nurture',
    description: 'Existing business relationships to maintain',
    iconName: 'Handshake',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    defaultStatus: 'Current Client',
    statusOptions: {
      'Current Client': { label: 'Current Client', description: 'Active client', colorClass: 'bg-green-100 text-green-800' },
      'Past Client': { label: 'Past Client', description: 'Previous client', colorClass: 'bg-blue-100 text-blue-800' },
      'Current Amplifier / Referral Source': { label: 'Current Amplifier / Referral Source', description: 'Active referrer', colorClass: 'bg-yellow-100 text-yellow-800' },
      'Strategic Partner': { label: 'Strategic Partner', description: 'Business partnership', colorClass: 'bg-purple-100 text-purple-800' },
      'Donor': { label: 'Donor', description: 'Financial supporter', colorClass: 'bg-rose-100 text-rose-800' },
      'Past Donor': { label: 'Past Donor', description: 'Previous donor', colorClass: 'bg-gray-100 text-gray-800' },
    }
  },
  personal_statuses: {
    label: 'Personal Connection',
    description: 'Friends, family, and personal relationships',
    iconName: 'Heart',
    colorClass: 'bg-pink-100 text-pink-800 border-pink-200',
    defaultStatus: 'Outer Circle',
    statusOptions: {
      'Friendly / Not Close': { label: 'Friendly / Not Close', description: 'Casual acquaintance', colorClass: 'bg-blue-100 text-blue-800' },
      'Outer Circle': { label: 'Outer Circle', description: 'Good friend', colorClass: 'bg-green-100 text-green-800' },
      'Close Circle': { label: 'Close Circle', description: 'Close friend', colorClass: 'bg-yellow-100 text-yellow-800' },
      'Inner Circle': { label: 'Inner Circle', description: 'Very close friend/family', colorClass: 'bg-orange-100 text-orange-800' },
      'Past Connection': { label: 'Past Connection', description: 'Former relationship', colorClass: 'bg-gray-100 text-gray-800' },
    }
  },
  civic_statuses: {
    label: 'Civic & Community',
    description: 'Government, community leaders, and civic organizations',
    iconName: 'Building',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
    defaultStatus: 'New',
    statusOptions: {
      'New': { label: 'New', description: 'New connection', colorClass: 'bg-blue-100 text-blue-800' },
      'Connected': { label: 'Connected', description: 'Established relationship', colorClass: 'bg-green-100 text-green-800' },
      'Trusted': { label: 'Trusted', description: 'Strong trusted relationship', colorClass: 'bg-yellow-100 text-yellow-800' },
      'Unaligned': { label: 'Unaligned', description: 'Different priorities', colorClass: 'bg-gray-100 text-gray-800' },
    }
  },
  vendor_statuses: {
    label: 'Service Provider/Vendor',
    description: 'Vendors, suppliers, and service providers',
    iconName: 'Shield',
    colorClass: 'bg-teal-100 text-teal-800 border-teal-200',
    defaultStatus: 'potential',
    statusOptions: {
      'potential': { label: 'Potential', description: 'Considering for use', colorClass: 'bg-blue-100 text-blue-800' },
      'active': { label: 'Active', description: 'Currently using', colorClass: 'bg-green-100 text-green-800' },
      'preferred': { label: 'Preferred', description: 'Go-to provider', colorClass: 'bg-yellow-100 text-yellow-800' },
    }
  },
  other_misc: {
    label: 'Other / Misc',
    description: 'Miscellaneous contacts',
    iconName: 'User',
    colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
    defaultStatus: 'general',
    statusOptions: {
      general: { label: 'General Contact', description: 'Standard relationship', colorClass: 'bg-blue-100 text-blue-800' },
    },
  },
};

export function useEnhancedRelationshipTypes() {
  const { user } = useAuth();
  const { data: relationshipTypes, error, isLoading } = useRelationshipTypesQuery(user?.id);
  const { categoryPreferences, enabledCategories } = useRelationshipCategoryPreferences();

  // Provide fallback data in case of query error
  const safeRelationshipTypes = error ? [] : (relationshipTypes || []);

  const queryClient = useQueryClient();

  // Fetch relationship intent configurations from database with error handling
  const { data: intentConfigs = [], error: intentConfigError, isLoading: intentConfigsLoading } = useQuery({
    queryKey: ['relationship-intent-configs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('relationship_intent_configs')
          .select('*')
          .order('intent');
        if (error) throw error;
        return data as DatabaseRelationshipIntentConfig[];
      } catch (error) {
        console.error('Error fetching relationship intent configs:', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    placeholderData: [],
    retry: 2,
  });

  // Fetch relationship status options from database with error handling
  const { data: statusOptions = [], error: statusOptionsError, isLoading: statusOptionsLoading } = useQuery({
    queryKey: ['relationship-status-options'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('relationship_status_options')
          .select('*')
          .order('intent', { ascending: true })
          .order('sort_order', { ascending: true });
        if (error) throw error;
        return data as DatabaseRelationshipStatusOption[];
      } catch (error) {
        console.error('Error fetching relationship status options:', error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    placeholderData: [],
    retry: 2,
  });

  // Combined loading state - wait for ALL data sources to be ready
  const isLoadingAnyConfig = isLoading || intentConfigsLoading || statusOptionsLoading;

  // Build relationship intent configs from database data with fallback
  const relationshipIntentConfigs = useMemo(() => {
    // If there are database errors, fall back to static configs
    if (intentConfigError || statusOptionsError) {
      console.warn('Using fallback relationship configs due to database errors', {
        intentConfigError,
        statusOptionsError
      });
      return RELATIONSHIP_INTENT_CONFIGS;
    }

    // During initial load, return empty object to prevent using stale hardcoded data
    if (!intentConfigs || !statusOptions) {
      return {} as Record<RelationshipIntent, RelationshipIntentConfig>;
    }

    // If data loaded but empty, use hardcoded as true fallback
    if (intentConfigs.length === 0) {
      console.warn('No intent configs in database, using hardcoded fallback');
      return RELATIONSHIP_INTENT_CONFIGS;
    }

    const configs: Record<RelationshipIntent, RelationshipIntentConfig> = {} as any;
    
    intentConfigs.forEach(config => {
      const intentStatusOptions = statusOptions
        .filter(option => option.intent === config.intent)
        .reduce((acc, option) => {
          acc[option.status_key as RelationshipStatus] = {
            label: option.label,
            description: option.description || '',
            colorClass: option.color_class,
            isTerminal: option.is_terminal,
          };
          return acc;
        }, {} as Record<RelationshipStatus, any>);

      configs[config.intent as RelationshipIntent] = {
        label: config.label,
        description: config.description || '',
        iconName: config.icon_name,
        colorClass: config.color_class,
        defaultStatus: config.default_status as RelationshipStatus,
        statusOptions: intentStatusOptions,
      };
    });

    return configs;
  }, [intentConfigs, statusOptions, intentConfigError, statusOptionsError]);

  const addRelationshipType = useCallback(async (relationshipTypeData: EnhancedRelationshipTypeCreate) => {
    if (!user) {
      toast.error('You must be logged in to add relationship types');
      return;
    }

    try {
      // Get the next sort order
      const maxSortOrder = Math.max(...safeRelationshipTypes.map(rt => rt.sortOrder), 0);

      const { data, error } = await supabase
        .from('user_relationship_types')
        .insert({
          user_id: user.id,
          name: relationshipTypeData.name,
          label: relationshipTypeData.label,
          icon_name: relationshipTypeData.iconName || 'Users',
          color_class: relationshipTypeData.colorClass || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
          relationship_intent: relationshipTypeData.relationshipIntent as any,
          is_default: false,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Relationship type added successfully');
      queryClient.invalidateQueries({ queryKey: relationshipTypesKeys.byUser(user.id) });
      return data;
    } catch (error) {
      console.error('Error adding relationship type:', error);
      toast.error('Failed to add relationship type');
      throw error;
    }
  }, [user, safeRelationshipTypes, queryClient]);

  const deleteRelationshipType = useCallback(async (relationshipTypeId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete relationship types');
      return;
    }

    try {
      const relationshipTypeToDelete = safeRelationshipTypes.find(rt => rt.id === relationshipTypeId);
      if (!relationshipTypeToDelete) return;

      // If it's a default relationship type, prevent deletion
      if (relationshipTypeToDelete.isDefault) {
        toast.error('Cannot delete default relationship types');
        return;
      }

      // First, reassign all contacts using this relationship type to a fallback
      const fallbackType = safeRelationshipTypes.find(rt => 
        rt.relationshipIntent === relationshipTypeToDelete.relationshipIntent && rt.id !== relationshipTypeId
      ) || safeRelationshipTypes.find(rt => rt.name === 'cold_lead') || safeRelationshipTypes[0];

      if (fallbackType) {
        await supabase
          .from('contacts')
          .update({ relationship_type: fallbackType.name })
          .eq('user_id', user.id)
          .eq('relationship_type', relationshipTypeToDelete.name);
      }

      // Delete the relationship type
      const { data, error } = await supabase
        .from('user_relationship_types')
        .delete()
        .eq('id', relationshipTypeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Relationship type deleted successfully');
      queryClient.invalidateQueries({ queryKey: relationshipTypesKeys.byUser(user.id) });
    } catch (error) {
      console.error('Error deleting relationship type:', error);
      toast.error('Failed to delete relationship type');
      throw error;
    }
  }, [user, safeRelationshipTypes, queryClient]);

  const getRelationshipTypeByName = useCallback((name: string) => {
    return safeRelationshipTypes.find(rt => rt.name === name);
  }, [safeRelationshipTypes]);

  const getTypesByIntent = useCallback((intent: RelationshipIntent) => {
    const filteredTypes = safeRelationshipTypes.filter(rt => rt.relationshipIntent === intent);
    
    // Filter by enabled categories
    const enabledCategoryNames = enabledCategories.map(cat => cat.category_name);
    
    return filteredTypes.filter(type => {
      // Map relationship intent to category name - UPDATED FOR NEW INTENTS
      const categoryMap: Record<string, string> = {
        'business_lead_statuses': 'business',
        'business_nurture_statuses': 'business',
        'personal_statuses': 'personal',
        'civic_statuses': 'civic_community',
        'vendor_statuses': 'service_provider',
        'other_misc': 'other_misc'
      };
      
      const categoryName = categoryMap[type.relationshipIntent];
      return !categoryName || enabledCategoryNames.includes(categoryName);
    });
  }, [safeRelationshipTypes, enabledCategories]);

  const getBusinessLeadTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'business_lead_statuses');
  }, [safeRelationshipTypes]);

  const getBusinessNurtureTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'business_nurture_statuses');
  }, [safeRelationshipTypes]);

  const getPersonalConnectionTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'personal_statuses');
  }, [safeRelationshipTypes]);

  const getCivicEngagementTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'civic_statuses');
  }, [safeRelationshipTypes]);

  const getPhilanthropyNonprofitTypes = useCallback(() => {
    // Deprecated - types were migrated to business_nurture_statuses
    return [];
  }, []);

  const getServiceProviderTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'vendor_statuses');
  }, [safeRelationshipTypes]);

  const getMediaPressTypes = useCallback(() => {
    // Deprecated - types were removed
    return [];
  }, []);

  const getOtherMiscTypes = useCallback(() => {
    return safeRelationshipTypes.filter(rt => rt.relationshipIntent === 'other_misc');
  }, [safeRelationshipTypes]);

  const getStatusOptionsForType = useCallback((relationshipTypeName: string) => {
    const type = getRelationshipTypeByName(relationshipTypeName);
    if (!type) return {};
    
    const config = relationshipIntentConfigs[type.relationshipIntent];
    return config?.statusOptions || {};
  }, [getRelationshipTypeByName, relationshipIntentConfigs]);

  const getDefaultStatusForType = useCallback((relationshipTypeName: string) => {
    const type = getRelationshipTypeByName(relationshipTypeName);
    if (!type) return 'new';
    
    const config = relationshipIntentConfigs[type.relationshipIntent];
    return config?.defaultStatus || 'new';
  }, [getRelationshipTypeByName, relationshipIntentConfigs]);

  const getIntentConfig = useCallback((intent: RelationshipIntent): RelationshipIntentConfig => {
    return relationshipIntentConfigs[intent] || {
      label: intent,
      description: '',
      iconName: 'User',
      colorClass: 'text-gray-600',
      defaultStatus: 'new' as RelationshipStatus,
      statusOptions: {},
    };
  }, [relationshipIntentConfigs]);

  const getStatusConfig = useCallback((intent: RelationshipIntent, status: RelationshipStatus) => {
    const statusOption = statusOptions.find(
      option => option.intent === intent && option.status_key === status
    );
    
    return {
      label: statusOption?.label || status,
      description: statusOption?.description || '',
      colorClass: statusOption?.color_class || 'bg-gray-100 text-gray-800 border-gray-200',
      isTerminal: statusOption?.is_terminal || false,
    };
  }, [statusOptions]);

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['relationship-intent-configs'] });
    queryClient.invalidateQueries({ queryKey: ['relationship-status-options'] });
    return queryClient.invalidateQueries({ 
      queryKey: relationshipTypesKeys.byUser(user?.id || '') 
    });
  }, [queryClient, user?.id]);

  // Filter all relationship types by enabled categories
  const filteredRelationshipTypes = safeRelationshipTypes.filter(type => {
    const categoryMap: Record<string, string> = {
      'business_lead_statuses': 'business',
      'business_nurture_statuses': 'business',
      'personal_statuses': 'personal', 
      'civic_statuses': 'civic_community',
      'vendor_statuses': 'service_provider',
      'other_misc': 'other_misc'
    };
    
    const categoryName = categoryMap[type.relationshipIntent];
    const enabledCategoryNames = enabledCategories.map(cat => cat.category_name);
    
    return !categoryName || enabledCategoryNames.includes(categoryName);
  });

  return {
    relationshipTypes: filteredRelationshipTypes,
    isLoading: isLoadingAnyConfig,
    addRelationshipType,
    deleteRelationshipType,
    getRelationshipTypeByName,
    getTypesByIntent,
    getBusinessLeadTypes,
    getBusinessNurtureTypes,
    getPersonalConnectionTypes,
    getCivicEngagementTypes,
    getPhilanthropyNonprofitTypes,
    getServiceProviderTypes,
    getMediaPressTypes,
    getOtherMiscTypes,
    getStatusOptionsForType,
    getDefaultStatusForType,
    getIntentConfig,
    getStatusConfig,
    reload,
    // Export the configuration constants for backward compatibility
    RELATIONSHIP_INTENT_CONFIGS: relationshipIntentConfigs,
    enabledCategories
  };
}