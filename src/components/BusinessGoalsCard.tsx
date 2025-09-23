import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { BusinessGoalsDialog } from '@/components/BusinessGoalsDialog';
import { useChallengeGoals } from '@/hooks/useChallengeGoals';

interface BusinessGoalsCardProps {
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
}

export function BusinessGoalsCard({ autoOpen, onAutoOpenHandled }: BusinessGoalsCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { goals, loading, saveGoals } = useChallengeGoals();

  useEffect(() => {
    if (autoOpen && !loading) {
      setShowDialog(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpen, loading, onAutoOpenHandled]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Challenge Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!goals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Challenge Goals
          </CardTitle>
          <CardDescription>
            Set your personal goals for this challenge to compete against yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You haven't set your challenge goals yet. Define your targets for leads, events, and revenue to track your progress.
          </p>
          <Button onClick={() => setShowDialog(true)} className="w-full">
            Set Your Challenge Goals
          </Button>
          {showDialog && (
            <BusinessGoalsDialog 
              open={showDialog}
              onOpenChange={setShowDialog}
              initialGoals={null}
              onSave={saveGoals}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  const goalItems = [
    {
      label: 'Leads Logged',
      current: goals.leads_current,
      target: goals.leads_goal,
      progress: goals.leads_progress,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Events Booked',
      current: goals.events_current,
      target: goals.events_goal,
      progress: goals.events_progress,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      label: 'Revenue Generated',
      current: goals.revenue_current,
      target: goals.revenue_goal,
      progress: goals.revenue_progress,
      icon: DollarSign,
      color: 'text-purple-600',
      isCurrency: true,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Challenge Goals
        </CardTitle>
        <CardDescription>
          Track your personal progress against your challenge goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {goalItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="text-muted-foreground">
                {item.isCurrency ? '$' : ''}{item.current.toLocaleString()} / {item.isCurrency ? '$' : ''}{item.target.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(item.progress, 100)} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {item.progress.toFixed(1)}% complete
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          onClick={() => setShowDialog(true)}
          className="w-full mt-4"
        >
          Edit Challenge Goals
        </Button>
        
        {showDialog && (
          <BusinessGoalsDialog 
            open={showDialog}
            onOpenChange={setShowDialog}
            initialGoals={goals ? {
              leads: goals.leads_goal,
              events: goals.events_goal,
              revenue: goals.revenue_goal,
            } : null}
            onSave={saveGoals}
          />
        )}
      </CardContent>
    </Card>
  );
}