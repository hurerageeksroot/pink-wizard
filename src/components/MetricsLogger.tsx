import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Send, TrendingUp } from 'lucide-react';

interface MetricsFormData {
  leads: number;
  booked_events: number;
  event_value: number;
  outreach_type: string;
  notes: string;
}

const MetricsLogger: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MetricsFormData>({
    leads: 0,
    booked_events: 0,
    event_value: 0,
    outreach_type: 'email',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to log metrics",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current challenge day (you might want to implement this logic)
      const challengeDay = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Insert metrics to user_metrics table
      const metricsToInsert = [];
      
      if (formData.leads > 0) {
        metricsToInsert.push({
          user_id: user.id,
          metric_name: 'leads',
          metric_type: 'count',
          value: formData.leads,
          unit: 'leads',
          challenge_day: challengeDay,
          notes: `${formData.outreach_type} outreach - ${formData.notes}`
        });
      }

      if (formData.booked_events > 0) {
        metricsToInsert.push({
          user_id: user.id,
          metric_name: 'booked_events',
          metric_type: 'count',
          value: formData.booked_events,
          unit: 'events',
          challenge_day: challengeDay,
          notes: `${formData.outreach_type} outreach - ${formData.notes}`
        });
      }

      if (formData.event_value > 0) {
        metricsToInsert.push({
          user_id: user.id,
          metric_name: 'event_value',
          metric_type: 'currency',
          value: formData.event_value,
          unit: 'usd',
          challenge_day: challengeDay,
          notes: `${formData.outreach_type} outreach - ${formData.notes}`
        });
      }

      if (metricsToInsert.length > 0) {
        const { error } = await supabase
          .from('user_metrics')
          .insert(metricsToInsert);

        if (error) throw error;

        toast({
          title: "Metrics Logged",
          description: `Successfully logged ${metricsToInsert.length} metric(s) for day ${challengeDay}`,
        });

        // Reset form
        setFormData({
          leads: 0,
          booked_events: 0,
          event_value: 0,
          outreach_type: 'email',
          notes: ''
        });
      } else {
        toast({
          title: "No Metrics to Log",
          description: "Please enter at least one metric value",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error logging metrics:', error);
      toast({
        title: "Error",
        description: "Failed to log metrics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Log Outreach Results
        </CardTitle>
        <CardDescription>
          Track your outreach performance and sync with the main dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leads">Leads Generated</Label>
              <Input
                id="leads"
                type="number"
                min="0"
                value={formData.leads}
                onChange={(e) => setFormData(prev => ({ ...prev, leads: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="booked_events">Events Booked</Label>
              <Input
                id="booked_events"
                type="number"
                min="0"
                value={formData.booked_events}
                onChange={(e) => setFormData(prev => ({ ...prev, booked_events: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="event_value">Event Value ($)</Label>
              <Input
                id="event_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.event_value}
                onChange={(e) => setFormData(prev => ({ ...prev, event_value: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outreach_type">Outreach Type</Label>
            <Select value={formData.outreach_type} onValueChange={(value) => setFormData(prev => ({ ...prev, outreach_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about your outreach..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Logging Metrics...' : 'Log Metrics'}
          </Button>
        </form>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Metrics will sync with the main dashboard and appear on the leaderboard</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsLogger;