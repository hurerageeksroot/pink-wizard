import React from 'react'
import { AdminLayout } from '@/components/Admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MichaelTaskFixer } from '@/components/Admin/MichaelTaskFixer'
import { Badge } from '@/components/ui/badge'
import { Clock, Globe, Calendar, CheckCircle } from 'lucide-react'

export default function WeekTransitionFix() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Week Transition Fix</h1>
            <p className="text-muted-foreground mt-2">
              Resolve timezone-related week transition issues and help affected users
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            Timezone Implementation
          </Badge>
        </div>

        {/* Root Cause Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Root Cause Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">The Problem</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Week transitions happen at midnight UTC, not user's local time</li>
                  <li>• Michael logged in at 9 PM and was already in "Week 2"</li>
                  <li>• Users lose access to previous week tasks immediately</li>
                  <li>• No timezone consideration in challenge day calculation</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">The Fix</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Added timezone field to user profiles</li>
                  <li>• Created timezone-aware week calculation functions</li>
                  <li>• Updated WeeklyTasks component to use user timezone</li>
                  <li>• Week transitions now happen at 11:59 PM user time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Michael's Specific Issue */}
        <MichaelTaskFixer />

        {/* System Improvements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              System Improvements Implemented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Database Functions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• get_user_challenge_day()</li>
                  <li>• get_user_current_week()</li>
                  <li>• admin_complete_weekly_task()</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Frontend Hooks</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• useUserTimezone()</li>
                  <li>• useTimezoneAwareWeek()</li>
                  <li>• Updated WeeklyTasks component</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">User Experience</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Timezone detection on signup</li>
                  <li>• 24-hour grace period (future)</li>
                  <li>• Admin manual completion tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Testing & Confirmation Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-1">1. Verify Michael's Fix</h4>
                <p className="text-sm text-muted-foreground">
                  Check that Michael's Week 1 tasks are completed and points awarded in his profile
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-1">2. Test Timezone Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Create a new test user and verify timezone is auto-detected and saved
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-1">3. Verify Week Calculation</h4>
                <p className="text-sm text-muted-foreground">
                  Test with different timezones to ensure week transitions happen at user's 11:59 PM
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-1">4. Monitor Week Transitions</h4>
                <p className="text-sm text-muted-foreground">
                  Watch for any users reporting similar issues after the fix is deployed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}