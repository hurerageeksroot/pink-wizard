import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RELATIONSHIP_INTENT_CONFIGS } from './useEnhancedRelationshipTypes';
import type { EnhancedRelationshipTypeData, RelationshipIntent } from '@/types/crm';

// Query key factory for relationship types
export const relationshipTypesKeys = {
  all: ['relationshipTypes'] as const,
  byUser: (userId: string) => [...relationshipTypesKeys.all, userId] as const,
};

// Default relationship types to seed if none exist - UPDATED FOR NEW INTENT STRUCTURE
const DEFAULT_RELATIONSHIP_TYPES = [
  // Business Category
  {
    name: 'lead_client',
    label: 'Lead - Client',
    icon_name: 'Target',
    color_class: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    is_lead_type: true,
    is_default: true,
    sort_order: 1,
    relationship_intent: 'business_lead_statuses' as RelationshipIntent
  },
  {
    name: 'lead_amplifier',
    label: 'Lead - Amplifier',
    icon_name: 'Share2',
    color_class: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    is_lead_type: true,
    is_default: true,
    sort_order: 2,
    relationship_intent: 'business_lead_statuses' as RelationshipIntent
  },
  {
    name: 'nurture',
    label: 'Nurture',
    icon_name: 'Handshake',
    color_class: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 3,
    relationship_intent: 'business_nurture_statuses' as RelationshipIntent
  },
  // Personal Category
  {
    name: 'family',
    label: 'Family',
    icon_name: 'Users',
    color_class: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 4,
    relationship_intent: 'personal_statuses' as RelationshipIntent
  },
  {
    name: 'friend',
    label: 'Friend',
    icon_name: 'Heart',
    color_class: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 5,
    relationship_intent: 'personal_statuses' as RelationshipIntent
  },
  {
    name: 'acquaintance',
    label: 'Acquaintance',
    icon_name: 'UserCheck',
    color_class: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 6,
    relationship_intent: 'personal_statuses' as RelationshipIntent
  },
  // Civic & Community Category
  {
    name: 'government',
    label: 'Government',
    icon_name: 'Building',
    color_class: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 7,
    relationship_intent: 'civic_statuses' as RelationshipIntent
  },
  {
    name: 'community_leaders',
    label: 'Community Leaders',
    icon_name: 'Users',
    color_class: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 8,
    relationship_intent: 'civic_statuses' as RelationshipIntent
  },
  {
    name: 'civic_organizations',
    label: 'Civic Organizations',
    icon_name: 'Building2',
    color_class: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 9,
    relationship_intent: 'civic_statuses' as RelationshipIntent
  },
  // Service Provider/Vendor Category
  {
    name: 'vendors',
    label: 'Vendors',
    icon_name: 'Truck',
    color_class: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 10,
    relationship_intent: 'vendor_statuses' as RelationshipIntent
  },
  {
    name: 'suppliers',
    label: 'Suppliers',
    icon_name: 'Package',
    color_class: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 11,
    relationship_intent: 'vendor_statuses' as RelationshipIntent
  },
  {
    name: 'service_provider',
    label: 'Service Provider',
    icon_name: 'Shield',
    color_class: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 12,
    relationship_intent: 'vendor_statuses' as RelationshipIntent
  },
  // Other/Misc Category
  {
    name: 'other',
    label: 'Other',
    icon_name: 'User',
    color_class: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
    is_lead_type: false,
    is_default: true,
    sort_order: 13,
    relationship_intent: 'other_misc' as RelationshipIntent
  }
];

async function fetchRelationshipTypes(userId: string): Promise<EnhancedRelationshipTypeData[]> {
  const { data: existingTypes, error: fetchError } = await supabase
    .from('user_relationship_types')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  // If no types exist, seed defaults
  if (!existingTypes || existingTypes.length === 0) {
    const typesToInsert = DEFAULT_RELATIONSHIP_TYPES.map(type => ({
      user_id: userId,
      name: type.name,
      label: type.label,
      icon_name: type.icon_name,
      color_class: type.color_class,
      is_lead_type: type.is_lead_type,
      is_default: type.is_default,
      sort_order: type.sort_order,
      relationship_intent: type.relationship_intent as any,
    }));

    const { data: insertedTypes, error: insertError } = await supabase
      .from('user_relationship_types')
      .insert(typesToInsert)
      .select('*')
      .order('sort_order', { ascending: true });

    if (insertError) {
      // If seeding fails, return the configs as fallback
      console.warn('Failed to seed relationship types, using fallback configs:', insertError);
      return DEFAULT_RELATIONSHIP_TYPES.map((type, index) => ({
        id: `fallback-${index}`,
        name: type.name,
        label: type.label,
        iconName: type.icon_name,
        colorClass: type.color_class,
        relationshipIntent: type.relationship_intent as RelationshipIntent,
        isDefault: type.is_default,
        sortOrder: type.sort_order,
      }));
    }

    // Transform database format to expected format
    const transformedData = (insertedTypes || []).map(item => ({
      id: item.id,
      name: item.name,
      label: item.label,
      iconName: item.icon_name,
      colorClass: item.color_class,
      relationshipIntent: item.relationship_intent as RelationshipIntent,
      isDefault: item.is_default,
      sortOrder: item.sort_order,
    }));

    return transformedData;
  }

  // Transform existing data to expected format
  const transformedData = existingTypes.map(item => ({
    id: item.id,
    name: item.name,
    label: item.label,
    iconName: item.icon_name,
    colorClass: item.color_class,
    relationshipIntent: item.relationship_intent as RelationshipIntent,
    isDefault: item.is_default,
    sortOrder: item.sort_order,
  }));

  return transformedData;
}

export function useRelationshipTypesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: relationshipTypesKeys.byUser(userId || ''),
    queryFn: () => fetchRelationshipTypes(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on user permission errors
      if (error?.message?.includes('permission')) return false;
      return failureCount < 2;
    }
  });
}