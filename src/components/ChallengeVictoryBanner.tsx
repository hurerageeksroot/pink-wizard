import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Trophy, Sparkles, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenge } from '@/hooks/useChallenge';

export function ChallengeVictoryBanner() {
  const { user } = useAuth();
  const { isActive, isChallengeParticipant, loading } = useChallenge();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('challenge-victory-dismissed') === 'true';
  });

  useEffect(() => {
    // Auto-dismiss after 7 days
    const dismissDate = localStorage.getItem('challenge-victory-dismiss-date');
    if (dismissDate) {
      const daysSince = (Date.now() - parseInt(dismissDate)) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('challenge-victory-dismissed', 'true');
    localStorage.setItem('challenge-victory-dismiss-date', Date.now().toString());
  };

  // Don't show if:
  // - Loading
  // - User is not logged in
  // - User is not a challenge participant
  // - Challenge is still active
  // - Already dismissed
  if (loading || !user || !isChallengeParticipant || isActive || dismissed) {
    return null;
  }

  return (
    <Alert className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-brand-coral/10 via-primary/10 to-accent/10">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-coral/5 to-brand-teal-light/5" />
      
      <div className="relative flex items-start gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Trophy className="h-6 w-6" />
          <Sparkles className="h-5 w-5" />
          <Award className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <AlertTitle className="text-xl font-bold mb-2 text-primary">
            🎉 Congratulations! You Completed the 75 Hard Mobile Bar Challenge!
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-base">
              You've reached the finish line! Thank you for your dedication, consistency, and commitment to growth throughout this challenge.
            </p>
            <p className="text-sm text-muted-foreground">
              Your achievements, points, and progress have been permanently saved. Scroll down to view your final statistics and see where you ranked among all participants.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700">
                As a challenge graduate, you have free access until September 8, 2026!
              </span>
            </div>
          </AlertDescription>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
