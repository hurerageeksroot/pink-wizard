import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { UserCheck, Award, CheckSquare } from 'lucide-react'

export const MichaelTaskFixer: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const { toast } = useToast()

  const completeMichaelTasks = async () => {
    setLoading(true)
    try {
      // Complete his 2nd weekly post task
      const response1 = await supabase.functions.invoke('admin-complete-weekly-task', {
        body: {
          userId: '1df2c88c-efc7-43e6-b3ee-ee6ffd9b1f82',
          taskId: '9e457d0c-7e02-415f-a572-5429d727b649',
          weekNumber: 1,
          notes: 'Retroactively completed - user missed due to week transition timing issue'
        }
      })

      // Complete his 3rd weekly post task
      const response2 = await supabase.functions.invoke('admin-complete-weekly-task', {
        body: {
          userId: '1df2c88c-efc7-43e6-b3ee-ee6ffd9b1f82',
          taskId: '56ea541b-f9c9-4343-8585-4347f7a02b65',
          weekNumber: 1,
          notes: 'Retroactively completed - user missed due to week transition timing issue'
        }
      })

      if (response1.error || response2.error) {
        throw new Error(`Failed to complete tasks: ${response1.error?.message || response2.error?.message}`)
      }

      console.log('Task completion results:', { response1: response1.data, response2: response2.data })

      setCompleted(true)
      toast({
        title: 'Success! 🎉',
        description: 'Michael\'s Week 1 tasks have been completed and points awarded'
      })
    } catch (error) {
      console.error('Error completing Michael\'s tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete Michael\'s tasks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <UserCheck className="w-5 h-5" />
          Michael's Week 1 Task Fix
          {completed && <Badge variant="default" className="bg-green-600">Completed</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          <p className="mb-2">
            <strong>Issue:</strong> Michael logged in at 9:00 PM and the system had already switched to Week 2, 
            preventing him from completing his Week 1 tasks.
          </p>
          <p>
            <strong>Solution:</strong> This will retroactively complete his remaining Week 1 tasks and award points.
          </p>
        </div>

        <div className="border border-orange-200 rounded-lg p-3 bg-white">
          <p className="text-sm font-medium text-orange-800 mb-2">Tasks to Complete:</p>
          <div className="space-y-1 text-sm text-orange-700">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Create & post 2nd weekly post for social media
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Create & post 3rd weekly post for social media
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm font-medium text-orange-800">
            <Award className="w-4 h-4" />
            50 points total (25 per task)
          </div>
        </div>

        <Button 
          onClick={completeMichaelTasks}
          disabled={loading || completed}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? 'Completing Tasks...' : completed ? 'Tasks Completed ✓' : 'Complete Michael\'s Tasks'}
        </Button>
      </CardContent>
    </Card>
  )
}