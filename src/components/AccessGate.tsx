import { ReactNode } from 'react';
import { useAccess } from '@/hooks/useAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, CreditCard, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessGateProps {
  children: ReactNode;
  feature: string;
  upgradeMessage?: string;
}

export function AccessGate({ children, feature, upgradeMessage }: AccessGateProps) {
  const { canWrite, loading } = useAccess();
  const navigate = useNavigate();

  // Show loading state while checking access
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Checking access...</span>
        </div>
      </div>
    );
  }

  // If user has access, render children
  if (canWrite) {
    return <>{children}</>;
  }

  // If no access, show upgrade gate
  return (
    <Card className="border-2 border-destructive/20 bg-destructive/5">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl text-destructive">
          Trial Access Required
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <Badge variant="destructive">
            🔒 Premium Feature
          </Badge>
          <h3 className="font-semibold">{feature}</h3>
          <p className="text-muted-foreground">
            {upgradeMessage || `This feature requires an active trial or paid subscription. Start your free trial to unlock ${feature.toLowerCase()} and build your business network.`}
          </p>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">What you get with a free trial:</span>
          </div>
          <ul className="text-sm space-y-1 text-left">
            <li>• Unlimited contact tracking</li>
            <li>• 1,500 AI tokens for outreach</li>
            <li>• Follow-up automation</li>
            <li>• Revenue tracking & analytics</li>
            <li>• Gamified progress system</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-primary hover:bg-primary/90"
          >
            <Clock className="h-4 w-4 mr-2" />
            Start Free Trial
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/pricing')}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            View Pricing
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}