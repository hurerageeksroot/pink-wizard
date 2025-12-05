import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, Sparkles, Target, Calendar } from 'lucide-react';
import { useChallenge } from '@/hooks/useChallenge';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { WelcomeModal } from '@/components/Onboarding/WelcomeModal';

export const ChallengeWelcomeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('challenge-welcome-dismissed') === 'true';
  });
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const { user } = useAuth();
  const { isChallengeParticipant, isActive, startDate, loading } = useChallenge();

  // Don't show if loading, dismissed, not a participant, no user, or challenge is inactive
  if (loading || dismissed || !isChallengeParticipant || !user || !isActive) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('challenge-welcome-dismissed', 'true');
  };

  const challengeStarted = new Date() >= new Date(startDate || '');

  return (
    <>
      <Alert className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">
                  Welcome 75 Hard Mobile Bar Challenge Participants! 🎉
                </h3>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Challenge HQ
                </Badge>
              </div>
              <AlertDescription className="text-base space-y-2">
                <p>
                  <strong>Surprise!</strong> Your challenge is now powered by <strong>PinkWizard</strong> - 
                  your command center for tracking progress, earning rewards, and dominating the leaderboards!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium">Available Now:</span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6">
                      <li>• <Link to="/?tab=tasks" className="text-primary hover:underline">Complete your onboarding checklist</Link></li>
                      <li>• <Link to="/settings?tab=business" className="text-primary hover:underline">Set up your business profile</Link></li>
                      <li>• <Link to="/?tab=dashboard&goals=true" className="text-primary hover:underline">Fill out your challenge goals</Link></li>
                      <li>• <button onClick={() => setWelcomeModalOpen(true)} className="text-primary hover:underline bg-transparent border-none p-0 cursor-pointer">Explore platform features</button></li>
                      <li>• <Link to="/?tab=community" className="text-primary hover:underline">Connect with other participants</Link></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {challengeStarted ? 'Now Active:' : 'Unlocks September 8th:'}
                      </span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6">
                      <li>• Daily challenge tasks</li>
                      <li>• Live leaderboards</li>
                      <li>• Badge & reward system</li>
                      <li>• Challenge community</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-background/50 rounded-lg border">
                  <p className="text-sm">
                    <strong>Important:</strong> Your login from 75hardmobilebevpros.com works here! 
                    Access through <a href="https://www.pink-wizard.com" className="text-primary hover:underline font-medium">www.pink-wizard.com</a> or 
                    the redirect from 75hardmobilebevpros.com.
                  </p>
                </div>
              </AlertDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
      
      <WelcomeModal 
        open={welcomeModalOpen} 
        onOpenChange={setWelcomeModalOpen} 
      />
    </>
  );
};