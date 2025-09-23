import React from 'react';
import { AlertCircle, CreditCard, Settings, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';

export const AccessBanner: React.FC = () => {
  const { 
    canWrite, 
    subscribed, 
    reason, 
    hasTrial, 
    isChallengeParticipant, 
    trialEndDate, 
    challengeEndDate,
    createCheckout, 
    openCustomerPortal,
    startTrial 
  } = useAccess();
  const { toast } = useToast();

  // Don't show access banner in embedded mode (iframe)
  const isInIframe = window.parent !== window;
  if (isInIframe) return null;

  if (canWrite) return null;

  const handleStartTrial = async () => {
    try {
      const result = await startTrial();
      if (result?.success) {
        toast({
          title: "Free Trial Started!",
          description: "Your 14-day free trial is now active. Enjoy full access to PinkWizard!",
        });
        // The access state should auto-refresh via checkAccess() in startTrial
      } else {
        throw new Error(result?.error || 'Failed to start trial');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      const url = await createCheckout();
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to open customer portal');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  const getMessage = () => {
    if (hasTrial && trialEndDate) {
      return `Free trial active - ${getTimeRemaining(trialEndDate)}`;
    }
    if (isChallengeParticipant && challengeEndDate) {
      return `Challenge participant - access until ${new Date(challengeEndDate).toLocaleDateString()}`;
    }
    return "You're in read-only mode. Start your free trial or subscribe to access all features.";
  };

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-amber-800 dark:text-amber-200">
            {getMessage()}
            {!hasTrial && !isChallengeParticipant && (
              <span className="block mt-1 text-sm">
                Get 14 days free, then $9/month for unlimited access to PinkWizard Pro.
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          {!hasTrial && !isChallengeParticipant && !subscribed && (
            <>
              <Button
                onClick={handleStartTrial}
                size="sm"
                variant="outline"
                className="border-amber-600 text-amber-700 hover:bg-amber-100"
              >
                <Clock className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
              <Button
                onClick={handleSubscribe}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe $9/mo
              </Button>
            </>
          )}
          {subscribed && (
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};