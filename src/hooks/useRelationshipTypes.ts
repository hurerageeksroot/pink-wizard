import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RelationshipTypeData {
  id: string;
  name: string;
  label: string;
  iconName: string;
  colorClass: string;
  isLeadType: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface RelationshipTypeCreate {
  name: string;
  label: string;
  iconName?: string;
  colorClass?: string;
  isLeadType: boolean;
}

export function useRelationshipTypes() {
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadRelationshipTypes = async () => {
    if (!user) {
      setRelationshipTypes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First, seed default relationship types if none exist
      const { count } = await supabase
        .from('user_relationship_types')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count === 0) {
        await supabase.rpc('seed_default_relationship_types', { p_user_id: user.id });
      }

      // Load relationship types
      const { data, error } = await supabase
        .from('user_relationship_types')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        label: item.label,
        iconName: item.icon_name,
        colorClass: item.color_class,
        isLeadType: item.is_lead_type,
        isDefault: item.is_default,
        sortOrder: item.sort_order,
      }));

      setRelationshipTypes(formattedData);
    } catch (error) {
      console.error('Error loading relationship types:', error);
      setRelationshipTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelationshipTypes();
  }, [user]);

  const addRelationshipType = async (relationshipTypeData: RelationshipTypeCreate) => {
    if (!user) return;

    try {
      // Get the next sort order
      const maxSortOrder = Math.max(...relationshipTypes.map(rt => rt.sortOrder), 0);

      const { data, error } = await supabase
        .from('user_relationship_types')
        .insert({
          user_id: user.id,
          name: relationshipTypeData.name,
          label: relationshipTypeData.label,
          icon_name: relationshipTypeData.iconName || 'Users',
          color_class: relationshipTypeData.colorClass || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
          is_lead_type: relationshipTypeData.isLeadType,
          is_default: false,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      const newRelationshipType: RelationshipTypeData = {
        id: data.id,
        name: data.name,
        label: data.label,
        iconName: data.icon_name,
        colorClass: data.color_class,
        isLeadType: data.is_lead_type,
        isDefault: data.is_default,
        sortOrder: data.sort_order,
      };

      setRelationshipTypes(prev => [...prev, newRelationshipType].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('Error adding relationship type:', error);
      throw error;
    }
  };

  const deleteRelationshipType = async (relationshipTypeId: string) => {
    if (!user) return;

    try {
      // Get the relationship type to be deleted
      const relationshipTypeToDelete = relationshipTypes.find(rt => rt.id === relationshipTypeId);
      if (!relationshipTypeToDelete) return;

      // If it's a default relationship type, prevent deletion
      if (relationshipTypeToDelete.isDefault) {
        throw new Error('Cannot delete default relationship types');
      }

      // First, reassign all contacts using this relationship type to the first available lead or nurture type
      const fallbackType = relationshipTypes.find(rt => 
        rt.isLeadType === relationshipTypeToDelete.isLeadType && rt.id !== relationshipTypeId
      ) || relationshipTypes.find(rt => rt.name === 'lead') || relationshipTypes[0];

      if (fallbackType) {
        await supabase
          .from('contacts')
          .update({ relationship_type: fallbackType.name })
          .eq('user_id', user.id)
          .eq('relationship_type', relationshipTypeToDelete.name);
      }

      // Delete the relationship type
      const { error } = await supabase
        .from('user_relationship_types')
        .delete()
        .eq('id', relationshipTypeId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRelationshipTypes(prev => prev.filter(rt => rt.id !== relationshipTypeId));
    } catch (error) {
      console.error('Error deleting relationship type:', error);
      throw error;
    }
  };

  const getRelationshipTypeByName = (name: string) => {
    return relationshipTypes.find(rt => rt.name === name);
  };

  const getLeadTypes = () => {
    return relationshipTypes.filter(rt => rt.isLeadType);
  };

  const getNurtureTypes = () => {
    return relationshipTypes.filter(rt => !rt.isLeadType);
  };

  const reload = () => {
    loadRelationshipTypes();
  };

  return {
    relationshipTypes,
    loading,
    addRelationshipType,
    deleteRelationshipType,
    getRelationshipTypeByName,
    getLeadTypes,
    getNurtureTypes,
    reload,
  };
}