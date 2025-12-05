import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Settings, Users, Target, Sparkles, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RelationshipCategorySelector } from '@/components/RelationshipCategorySelector';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const handleStepAction = (action: string) => {
    switch (action) {
      case 'categories':
        setShowCategorySelector(true);
        break;
      case 'profile':
        navigate('/ai-outreach?profile=1');
        handleClose();
        break;
      case 'import':
        navigate('/?tab=contacts&action=import');
        handleClose();
        break;
      case 'ready':
        navigate('/?tab=contacts&filter=ready');
        handleClose();
        break;
      case 'generate':
        navigate('/ai-outreach');
        handleClose();
        break;
    }
  };

  const handleCategorySelectionComplete = (selectedCategories: string[]) => {
    setShowCategorySelector(false);
    // Categories are automatically enabled by the selector component
  };

  const handleClose = () => {
    onOpenChange(false);
    // Mark as seen when user closes the modal
    const userId = localStorage.getItem('current-user-id') || 'anonymous';
    localStorage.setItem(`welcome-seen-${userId}`, 'true');
  };

  const steps = [
    {
      id: 'categories',
      title: 'Choose your relationship categories',
      description: 'Select the types of relationships you want to track in your CRM',
      icon: Sliders,
      action: 'categories',
      buttonText: 'Select Categories'
    },
    {
      id: 'profile',
      title: 'Set up your business profile',
      description: 'Help the AI understand your business so it can craft perfect spells for you',
      icon: Settings,
      action: 'profile',
      buttonText: 'Edit Profile'
    },
    {
      id: 'import',
      title: 'Add your contacts',
      description: 'Upload your list or add people manually—time to fill your cauldron',
      icon: Users,
      action: 'import',
      buttonText: 'Import Contacts'
    },
    {
      id: 'ready',
      title: 'Find contacts ready for outreach',
      description: 'We\'ll show you who needs a nudge or would be perfect for your first charm',
      icon: Target,
      action: 'ready',
      buttonText: 'Find Ready Contacts'
    },
    {
      id: 'generate',
      title: 'Cast your first outreach spell',
      description: 'Use AI to create messages that feel like you—but with a little extra magic',
      icon: Sparkles,
      action: 'generate',
      buttonText: 'Generate Outreach'
    }
  ];

  if (showCategorySelector) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                 <Sparkles className="h-6 w-6" />
               </div>
              <div>
                <DialogTitle className="text-2xl">Welcome to PinkWizard ✨</DialogTitle>
                <DialogDescription className="text-base">
                  First, let's set up your relationship categories
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <RelationshipCategorySelector 
            mode="onboarding"
            onComplete={handleCategorySelectionComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-primary text-primary-foreground rounded-lg">
               <Sparkles className="h-6 w-6" />
             </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to PinkWizard ✨</DialogTitle>
              <DialogDescription className="text-base">
                Ready to cast your first follow-up? Let's set up your outreach magic in 5 quick steps.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.id} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                        <h3 className="font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      <Button 
                        onClick={() => handleStepAction(step.action)}
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      >
                        {step.buttonText}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            You can always access help from the Help Center
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/help')}
            >
              Help Center
            </Button>
            <Button onClick={handleClose}>
              Got it, thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};