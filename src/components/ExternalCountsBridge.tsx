import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDailyRevenueTotals, type DailyRevenueData } from '@/utils/revenueSync';

export interface ExternalOutreachCounts {
  day: number;
  coldOutreach: number;
  nurturingOutreach: number;
  totalOutreach: number;
  lastUpdated: string;
}

interface ExternalCountsBridgeProps {
  onCountsReceived?: (counts: ExternalOutreachCounts) => void;
}

export const ExternalCountsBridge: React.FC<ExternalCountsBridgeProps> = ({ onCountsReceived }) => {
  const [isInIframe, setIsInIframe] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'listening' | 'connected'>('idle');
  const [lastCounts, setLastCounts] = useState<ExternalOutreachCounts | null>(null);
  const [waitingForCounts, setWaitingForCounts] = useState(false);
  const [lastRevenueData, setLastRevenueData] = useState<DailyRevenueData | null>(null);
  const [messagesSent, setMessagesSent] = useState<number>(0);

  useEffect(() => {
    // Reduced logging for performance
    const inIframe = window.parent !== window;
    setIsInIframe(inIframe);

    if (!inIframe) {
      setBridgeStatus('idle');
      return;
    }

    setBridgeStatus('listening');
    // Setting up message listener in iframe mode

    // Load cached counts from localStorage
    const cachedCounts = localStorage.getItem('pinkwizard-external-counts');
    if (cachedCounts) {
      try {
        const counts = JSON.parse(cachedCounts) as ExternalOutreachCounts;
        setLastCounts(counts);
        onCountsReceived?.(counts);
        console.log('[ExternalCountsBridge] Loaded cached counts:', counts);
      } catch (error) {
        console.error('[ExternalCountsBridge] Failed to parse cached counts:', error);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from allowed origins
      const allowedOrigins = [
        'https://pink-wizard.com',
        'https://mbp-holiday-75hard.lovable.app'
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('[ExternalCountsBridge] Message from disallowed origin:', event.origin);
        return;
      }

      console.log('[ExternalCountsBridge] Received message:', {
        type: event.data?.type,
        origin: event.origin,
        hasPayload: !!event.data?.payload,
        fullData: event.data
      });

      if (event.data?.type === 'PINKWIZARD_OUTREACH_COUNTS') {
        const counts = event.data.payload as ExternalOutreachCounts;
        
        // Validate the payload
        if (
          typeof counts.day === 'number' &&
          typeof counts.coldOutreach === 'number' &&
          typeof counts.nurturingOutreach === 'number' &&
          typeof counts.totalOutreach === 'number' &&
          typeof counts.lastUpdated === 'string'
        ) {
          console.log('[ExternalCountsBridge] Valid counts received:', counts);
          setLastCounts(counts);
          setBridgeStatus('connected');
          setWaitingForCounts(false);
          
          // Cache the counts and trigger storage event
          localStorage.setItem('pinkwizard-external-counts', JSON.stringify(counts));
          
          // Manually trigger storage event for same-window components
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'pinkwizard-external-counts',
            newValue: JSON.stringify(counts),
            storageArea: localStorage
          }));
          
          // Notify parent component
          onCountsReceived?.(counts);
        } else {
          console.error('[ExternalCountsBridge] Invalid counts payload:', counts);
        }
      }

      // ExternalCountsBridge only handles counts - auth is handled by SessionBridge
    };

    window.addEventListener('message', handleMessage);

    // Request initial counts from parent
    setWaitingForCounts(true);
    console.log('[ExternalCountsBridge] Requesting outreach counts from parent');
    window.parent.postMessage({ type: 'REQUEST_PINKWIZARD_OUTREACH_COUNTS' }, '*');

    // Set timeout to stop waiting after 5 seconds
    const timeout = setTimeout(() => {
      setWaitingForCounts(false);
      console.log('[ExternalCountsBridge] Timeout waiting for counts from parent');
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  const testWithMockData = () => {
    const mockCounts = {
      day: 15,
      coldOutreach: 8,
      nurturingOutreach: 12,
      totalOutreach: 20,
      lastUpdated: new Date().toISOString()
    };
    console.log('[ExternalCountsBridge] Testing with mock data:', mockCounts);
    localStorage.setItem('pinkwizard-external-counts', JSON.stringify(mockCounts));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pinkwizard-external-counts',
      newValue: JSON.stringify(mockCounts),
      storageArea: localStorage
    }));
    setLastCounts(mockCounts);
    setBridgeStatus('connected');
    setWaitingForCounts(false);
  };

  const testRevenueSync = async () => {
    const mockRevenue = {
      day: 15,
      totalRevenue: 25000,
      eventCount: 3,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('[ExternalCountsBridge] Testing revenue sync:', mockRevenue);
    setLastRevenueData(mockRevenue);
    
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'PINKWIZARD_DAILY_REVENUE_UPDATE',
        payload: mockRevenue,
        timestamp: new Date().toISOString()
      }, '*');
      setMessagesSent(prev => prev + 1);
    }
  };

  const loadCurrentRevenueData = async () => {
    const revenueData = await getDailyRevenueTotals();
    if (revenueData) {
      setLastRevenueData(revenueData);
      console.log('[ExternalCountsBridge] Loaded current revenue data:', revenueData);
    }
  };

  // Always render in development for debugging, but keep it minimal
  if (import.meta.env.DEV && !isInIframe) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs">
        <div className="bg-card border border-border rounded-lg p-3 shadow-card">
          <div className="text-xs font-medium mb-2">External Counts Bridge</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={
                bridgeStatus === 'connected' ? "default" : 
                bridgeStatus === 'listening' ? "secondary" : 
                "outline"
              }>
                {bridgeStatus}
              </Badge>
            </div>
            <div className="flex gap-1 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testWithMockData}
                className="flex-1"
              >
                Test Counts
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testRevenueSync}
                className="flex-1"
              >
                Test Revenue
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={loadCurrentRevenueData}
              className="mt-1 w-full"
            >
              Load Revenue Data
            </Button>
            {(lastCounts || lastRevenueData) && (
              <div className="mt-2 pt-2 border-t border-border">
                {lastCounts && (
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">Last Counts:</div>
                    <div>Day {lastCounts.day}: {lastCounts.totalOutreach} outreach</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lastCounts.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                {lastRevenueData && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Revenue Data:</div>
                    <div>Day {lastRevenueData.day}: ${lastRevenueData.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs">Events: {lastRevenueData.eventCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(lastRevenueData.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                {messagesSent > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Messages sent: {messagesSent}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExternalCountsBridge;