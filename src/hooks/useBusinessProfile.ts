import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessProfile } from '@/types/crm';

export function useBusinessProfile() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          businessName: data.business_name,
          valueProp: data.value_proposition,
          industry: data.industry,
          targetMarket: data.target_market,
          keyDifferentiators: data.key_differentiators,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        });
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: Partial<BusinessProfile>) => {
    if (!user) return;

    try {
      const payload = {
        user_id: user.id,
        business_name: profileData.businessName,
        value_proposition: profileData.valueProp,
        industry: profileData.industry,
        target_market: profileData.targetMarket,
        key_differentiators: profileData.keyDifferentiators,
      };

      const { data, error } = await supabase
        .from('business_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setProfile({
        id: data.id,
        userId: data.user_id,
        businessName: data.business_name,
        valueProp: data.value_proposition,
        industry: data.industry,
        targetMarket: data.target_market,
        keyDifferentiators: data.key_differentiators,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });

      return true;
    } catch (error) {
      console.error('Error saving business profile:', error);
      return false;
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    saveProfile,
    refetch: loadProfile,
  };
}