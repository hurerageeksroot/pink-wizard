import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useUserTimezone } from './useUserTimezone'

export const useTimezoneAwareWeek = () => {
  const { user } = useAuth()
  const { timezone, loading: timezoneLoading } = useUserTimezone()

  const { data: currentWeek, isLoading: weekLoading, refetch } = useQuery({
    queryKey: ['userCurrentWeek', user?.id, timezone],
    queryFn: async () => {
      if (!user?.id) return 1

      const { data, error } = await supabase
        .rpc('get_user_current_week', {
          user_id_param: user.id,
          user_timezone: timezone
        })

      if (error) {
        console.error('Error getting user current week:', error)
        return 1
      }

      return data || 1
    },
    enabled: !!user?.id && !!timezone,
    staleTime: 60 * 1000, // 1 minute - refresh frequently for week transitions
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })

  const { data: currentDay, isLoading: dayLoading } = useQuery({
    queryKey: ['userCurrentDay', user?.id, timezone],
    queryFn: async () => {
      if (!user?.id) return 1

      const { data, error } = await supabase
        .rpc('get_user_challenge_day', {
          user_id_param: user.id,
          user_timezone: timezone
        })

      if (error) {
        console.error('Error getting user current day:', error)
        return 1
      }

      return data || 1
    },
    enabled: !!user?.id && !!timezone,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })

  const loading = timezoneLoading || weekLoading || dayLoading

  return {
    currentWeek: currentWeek || 1,
    currentDay: currentDay || 1,
    timezone,
    loading,
    refetch
  }
}