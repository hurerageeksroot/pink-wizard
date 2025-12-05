import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";
import { useChallenge } from "@/hooks/useChallenge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Calendar } from "lucide-react";

export function RevenueDialog() {
  const { isOpen, contactName, contactId, contactStatus, closeDialog, logRevenue, currentRevenue } = useRevenueDialog();
  const { isChallengeParticipant } = useChallenge();
  const [revenue, setRevenue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [revenueType, setRevenueType] = useState<'direct' | 'referral'>('direct');
  const [referredClient, setReferredClient] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);

  // Load current revenue when editing, reset when closing
  useEffect(() => {
    if (isOpen && currentRevenue) {
      // Editing mode - populate all fields from currentRevenue object
      setRevenue(currentRevenue.amount?.toString() || '');
      setNotes(currentRevenue.notes || '');
      setRevenueType(currentRevenue.revenueType || 'direct');
      setReferredClient(currentRevenue.referredClient || '');
    } else if (!isOpen) {
      // Reset form when dialog closes
      setRevenue('');
      setNotes('');
      setRevenueType('direct');
      setReferredClient('');
    }
  }, [isOpen, currentRevenue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const revenueAmount = parseFloat(revenue);
    if (isNaN(revenueAmount) || revenueAmount <= 0) {
      return;
    }

    setIsLogging(true);
    
    const success = await logRevenue(revenueAmount, notes, revenueType, referredClient);
    
    if (success) {
      setRevenue('');
      setNotes('');
      setRevenueType('direct');
      setReferredClient('');
    }
    
    setIsLogging(false);
  };

  const handleSkip = () => {
    setRevenue('');
    setNotes('');
    setRevenueType('direct');
    setReferredClient('');
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[425px] fixed z-[9999] bg-background border shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {revenueType === 'direct' ? 'Event Revenue' : 'Referral Revenue'} - {contactName}
          </DialogTitle>
          <DialogDescription>
            {revenueType === 'direct' 
              ? `Log revenue from ${contactName}.${isChallengeParticipant ? ' This will sync with your 75 Hard challenge progress.' : ''}`
              : `Log referral revenue generated through ${contactName}.${isChallengeParticipant ? ' This will sync with your 75 Hard challenge progress.' : ''}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revenueType">Revenue Type</Label>
            <Select value={revenueType} onValueChange={(value: 'direct' | 'referral') => setRevenueType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select revenue type" />
              </SelectTrigger>
              <SelectContent className="z-[10000] bg-background border shadow-lg">
                <SelectItem value="direct">Direct Revenue (from this contact)</SelectItem>
                <SelectItem value="referral">Referral Revenue (through this contact)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {revenueType === 'referral' && (
            <div className="space-y-2">
              <Label htmlFor="referredClient">Referred Client (Optional)</Label>
              <Input
                id="referredClient"
                placeholder="Name of the client who was referred..."
                value={referredClient}
                onChange={(e) => setReferredClient(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="revenue">{revenueType === 'direct' ? 'Event Revenue' : 'Referral Revenue'} (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="revenue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{revenueType === 'direct' ? 'Event Details' : 'Referral Details'} (Optional)</Label>
            <Textarea
              id="notes"
              placeholder={revenueType === 'direct' 
                ? "Event type, duration, additional notes..." 
                : "Details about the referral, commission structure, etc..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={!revenue || isLogging}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isLogging ? "Logging..." : currentRevenue ? `Update ${revenueType === 'direct' ? 'Revenue' : 'Referral Revenue'}` : `Log ${revenueType === 'direct' ? 'Revenue' : 'Referral Revenue'}`}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkip}
              disabled={isLogging}
            >
              Skip
            </Button>
          </div>
        </form>

        {isChallengeParticipant && (
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-gradient-primary rounded-full"></div>
              <span className="font-medium">75 Hard Integration</span>
            </div>
            This revenue will be logged as both a booked event and revenue metric in your 75 Hard challenge tracking.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}