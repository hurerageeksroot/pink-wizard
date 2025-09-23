import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bell, CheckCircle } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useToast } from '@/hooks/use-toast';

export function BadgeNotificationFix() {
  const { triggerRecentBadgeNotifications } = useGamification();
  const { toast } = useToast();
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerNotifications = async () => {
    setIsTriggering(true);
    try {
      console.log('🔔 [BadgeNotificationFix] Manually triggering missed badge notifications...');
      const recentBadges = await triggerRecentBadgeNotifications();
      
      if (recentBadges && recentBadges.length > 0) {
        toast({
          title: "📧 Notifications Sent!",
          description: `Triggered notifications for ${recentBadges.length} recent badges.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "ℹ️ No Recent Badges",
          description: "No badges from the last 24 hours found to notify about.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ [BadgeNotificationFix] Error triggering notifications:', error);
      toast({
        title: "❌ Error",
        description: "Failed to trigger notifications. Check console for details.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Bell className="h-4 w-4" />
          Badge Notification Fix
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          If you recently earned badges but didn't receive notifications, click below to trigger them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleTriggerNotifications}
          disabled={isTriggering}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          size="sm"
        >
          {isTriggering ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              Sending Notifications...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Trigger Missed Badge Notifications
            </>
          )}
        </Button>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          This will send notifications for badges earned in the last 24 hours.
        </p>
      </CardContent>
    </Card>
  );
}