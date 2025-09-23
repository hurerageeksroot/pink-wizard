import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export const useUserTimezone = () => {
  const [timezone, setTimezone] = useState<string>('America/New_York')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Detect browser timezone
  const detectTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      console.warn('Could not detect timezone:', error)
      return 'America/New_York'
    }
  }

  // Load user's saved timezone
  const loadUserTimezone = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (profile?.timezone) {
        setTimezone(profile.timezone)
      } else {
        // First time - set to browser timezone
        const browserTimezone = detectTimezone()
        await updateTimezone(browserTimezone)
        setTimezone(browserTimezone)
      }
    } catch (error) {
      console.error('Error loading timezone:', error)
      // Fallback to browser timezone
      const browserTimezone = detectTimezone()
      setTimezone(browserTimezone)
    } finally {
      setLoading(false)
    }
  }

  // Update timezone in database
  const updateTimezone = async (newTimezone: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          timezone: newTimezone,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setTimezone(newTimezone)
      toast({
        title: 'Success',
        description: 'Timezone updated successfully'
      })
      return true
    } catch (error) {
      console.error('Error updating timezone:', error)
      toast({
        title: 'Error',
        description: 'Failed to update timezone',
        variant: 'destructive'
      })
      return false
    }
  }

  useEffect(() => {
    loadUserTimezone()
  }, [user])

  return {
    timezone,
    loading,
    updateTimezone,
    detectTimezone,
    refetch: loadUserTimezone
  }
}