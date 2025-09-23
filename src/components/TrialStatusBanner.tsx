import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface TrialStatus {
  hasActiveTrial: boolean;
  trialDaysRemaining: number;
  trialProgress: number;
  aiTokensRemaining: number;
  aiTokensTotal: number;
}

export function TrialStatusBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { hasSubscription, hasPayment, isChallengeParticipant } = useAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchTrialStatus = async () => {
      try {
        // Check trial status
        const { data: trial } = await supabase
          .from('user_trials')
          .select('trial_start_at, trial_end_at, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        // Check AI tokens
        const { data: credits } = await supabase
          .from('ai_credits')
          .select('tokens_total, tokens_remaining')
          .eq('user_id', user.id)
          .eq('source', 'trial')
          .eq('status', 'active')
          .maybeSingle();

        if (trial) {
          const now = new Date();
          const endDate = new Date(trial.trial_end_at);
          const startDate = new Date(trial.trial_start_at);
          const totalDays = 14;
          const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const progress = Math.min(100, (daysElapsed / totalDays) * 100);

          setTrialStatus({
            hasActiveTrial: true,
            trialDaysRemaining: daysRemaining,
            trialProgress: progress,
            aiTokensRemaining: credits?.tokens_remaining || 0,
            aiTokensTotal: credits?.tokens_total || 1500
          });
        } else {
          setTrialStatus({
            hasActiveTrial: false,
            trialDaysRemaining: 0,
            trialProgress: 100,
            aiTokensRemaining: 0,
            aiTokensTotal: 0
          });
        }
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [user]);

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  if (loading || !trialStatus) return null;

  // CRITICAL: Only show trial banner to users who have a trial BUT NO paid access
  // If user has paid access (subscription/payment/challenge), don't show trial banner
  if (!trialStatus.hasActiveTrial) return null;
  if (hasSubscription || hasPayment || isChallengeParticipant) return null;

  const isUrgent = trialStatus.trialDaysRemaining <= 2;
  const isLowTokens = trialStatus.aiTokensRemaining < (trialStatus.aiTokensTotal * 0.2);

  return (
    <Card className={`mb-6 border-2 ${isUrgent ? 'border-destructive bg-destructive/5' : isLowTokens ? 'border-warning bg-warning/5' : 'border-primary bg-primary/5'}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
              <Badge variant={isUrgent ? "destructive" : "secondary"}>
                {trialStatus.trialDaysRemaining === 0 
                  ? 'Trial Expires Today!' 
                  : `${trialStatus.trialDaysRemaining} days left in trial`
                }
              </Badge>
            </div>
            
            <h3 className={`font-semibold mb-1 ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
              {isUrgent 
                ? "⏰ Your trial is expiring soon!" 
                : "🎯 Free Trial Active"
              }
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trial Progress</span>
                <span className="font-medium">{Math.round(trialStatus.trialProgress)}%</span>
              </div>
              <Progress value={trialStatus.trialProgress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="text-muted-foreground">AI Tokens</span>
                </div>
                <span className={`font-medium ${isLowTokens ? 'text-warning' : ''}`}>
                  {trialStatus.aiTokensRemaining} / {trialStatus.aiTokensTotal}
                </span>
              </div>
              <Progress 
                value={(trialStatus.aiTokensRemaining / trialStatus.aiTokensTotal) * 100} 
                className="h-2" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            {isUrgent && (
              <Button 
                onClick={handleUpgradeClick}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            )}
            {!isUrgent && (
              <Button 
                variant="outline" 
                onClick={handleUpgradeClick}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Pricing
              </Button>
            )}
          </div>
        </div>
        
        {isUrgent && (
          <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              ⚠️ After your trial expires, you'll lose access to your contacts, AI outreach, and follow-up automation. 
              Upgrade now to keep building valuable business relationships!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}