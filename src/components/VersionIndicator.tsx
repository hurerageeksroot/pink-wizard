import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const CURRENT_VERSION = '1.0.2';

export const VersionIndicator = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    // Check if running version matches deployed version
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.warn('[VersionIndicator] Version mismatch detected:', {
        stored: storedVersion,
        current: CURRENT_VERSION
      });
      setNeedsUpdate(true);
    } else if (!storedVersion) {
      // First time or after cache clear - set current version
      console.log('[VersionIndicator] Setting initial version:', CURRENT_VERSION);
      localStorage.setItem('app_version', CURRENT_VERSION);
    }

    // Track last activity logged (for detecting stale apps)
    const checkLastActivity = () => {
      const lastLog = localStorage.getItem('last_activity_logged');
      if (lastLog) {
        setLastActivity(new Date(lastLog));
      }
    };

    checkLastActivity();
    const interval = setInterval(checkLastActivity, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleForceRefresh = () => {
    console.log('[VersionIndicator] User requested force refresh');
    localStorage.setItem('app_version', CURRENT_VERSION);
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Hard reload
    window.location.reload();
  };

  // Calculate days since last activity
  const daysSinceActivity = lastActivity 
    ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (needsUpdate) {
    return (
      <Alert className="fixed bottom-4 right-4 max-w-md shadow-lg border-destructive z-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">App Update Required</p>
            <p className="text-sm">
              A critical update is available. Please refresh to ensure touchpoint logging works correctly.
            </p>
            <Button 
              onClick={handleForceRefresh}
              size="sm"
              className="w-full"
              variant="destructive"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if user hasn't logged in 3+ days (for active participants)
  if (daysSinceActivity !== null && daysSinceActivity >= 3) {
    const handleDismiss = () => {
      localStorage.setItem('activity_warning_dismissed', 'true');
      setLastActivity(null); // Hide the warning
    };

    const isDismissed = localStorage.getItem('activity_warning_dismissed') === 'true';
    if (isDismissed) return null;

    return (
      <Alert className="fixed bottom-4 right-4 max-w-sm shadow-lg border-yellow-500 z-50">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="text-sm">
              No touchpoints logged in {daysSinceActivity} days. Having trouble logging?
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleForceRefresh}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh App
              </Button>
              <Button 
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show version badge in dev/test (hidden in production)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject')) {
    return (
      <Badge 
        variant="outline" 
        className="fixed bottom-2 right-2 text-xs opacity-50 hover:opacity-100 transition-opacity z-50"
      >
        v{CURRENT_VERSION}
      </Badge>
    );
  }

  return null;
};
