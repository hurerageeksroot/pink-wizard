import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface BusinessGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGoals: {
    leads: number;
    events: number;
    revenue: number;
  } | null;
  onSave: (leads: number, events: number, revenue: number) => Promise<boolean>;
}

export function BusinessGoalsDialog({ open, onOpenChange, initialGoals, onSave }: BusinessGoalsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leads: initialGoals?.leads || 0,
    events: initialGoals?.events || 0,
    revenue: initialGoals?.revenue || 0,
  });

  // Update form data when initialGoals changes
  useEffect(() => {
    if (initialGoals) {
      setFormData({
        leads: initialGoals.leads,
        events: initialGoals.events,
        revenue: initialGoals.revenue,
      });
    }
  }, [initialGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await onSave(formData.leads, formData.events, formData.revenue);
    
    if (success) {
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Your Challenge Goals
          </DialogTitle>
          <DialogDescription>
            Define your personal targets for this challenge. These goals help you compete against yourself and track meaningful progress.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leads" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Leads to Log
              </Label>
              <Input
                id="leads"
                type="number"
                min="0"
                value={formData.leads}
                onChange={(e) => handleInputChange('leads', e.target.value)}
                placeholder="How many new leads do you want to log?"
              />
              <p className="text-xs text-muted-foreground">
                Target number of new contacts you want to add to your CRM
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Events to Book
              </Label>
              <Input
                id="events"
                type="number"
                min="0"
                value={formData.events}
                onChange={(e) => handleInputChange('events', e.target.value)}
                placeholder="How many events/meetings do you want to book?"
              />
              <p className="text-xs text-muted-foreground">
                Target number of meetings, calls, or appointments to schedule
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revenue" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Revenue Target ($)
              </Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                step="0.01"
                value={formData.revenue}
                onChange={(e) => handleInputChange('revenue', e.target.value)}
                placeholder="How much revenue do you want to generate?"
              />
              <p className="text-xs text-muted-foreground">
                Target revenue amount you want to close during the challenge
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Goals'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}