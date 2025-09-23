import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Users, Target, Sparkles, Settings, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useCRMData } from '@/hooks/useCRMData';

interface CoachBannerProps {
  onDismiss: () => void;
}

export const CoachBanner: React.FC<CoachBannerProps> = ({ onDismiss }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useBusinessProfile();
  const { contacts, activities } = useCRMData();

  // Only show for truly new users who haven't started
  const getNextAction = () => {
    const hasProfile = profile?.businessName && profile?.valueProp;
    const hasContacts = contacts.length > 0;
    const hasActivities = activities.length > 0;

    // Business profile not set up
    if (!hasProfile) {
      return {
        title: 'Let\'s set up your business profile first',
        description: 'Help the AI understand your business so it can craft perfect spells for you',
        icon: Settings,
        action: () => navigate('/ai-outreach?profile=1'),
        buttonText: 'Set Up Profile',
        priority: 'high'
      };
    }

    // No contacts yet
    if (!hasContacts) {
      return {
        title: 'Time to add your contacts',
        description: 'Upload your list or add people manually—let\'s fill your cauldron',
        icon: Users,
        action: () => navigate('/?tab=contacts&action=import'),
        buttonText: 'Import Contacts',
        priority: 'high'
      };
    }

    // User is onboarded - don't show banner
    return null;
  };

  const nextAction = getNextAction();

  // Don't show banner if no action needed or on certain pages
  if (!nextAction || location.pathname === '/help' || location.pathname === '/auth') {
    return null;
  }

  const Icon = nextAction.icon;
  const priorityColor = nextAction.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
  const badgeColor = nextAction.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

  return (
    <Card className={`${priorityColor} mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={badgeColor}>
                  Next Step
                </Badge>
                <h3 className="font-semibold text-sm">{nextAction.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {nextAction.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              onClick={() => {
                console.log('Coach banner button clicked:', nextAction.buttonText);
                try {
                  nextAction.action();
                } catch (error) {
                  console.error('Error executing coach banner action:', error);
                }
              }}
              size="sm"
              className="bg-gradient-primary hover:opacity-90 whitespace-nowrap"
            >
              {nextAction.buttonText}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
              className="p-2 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};