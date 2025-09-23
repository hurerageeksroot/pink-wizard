import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Truck } from "lucide-react";

interface RewardRequestDialogProps {
  reward: {
    id: string;
    reward_name: string;
    reward_description: string;
    reward_image_url?: string;
    request_status: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export function RewardRequestDialog({ reward, isOpen, onClose, onRequestSubmitted }: RewardRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reward) return;

    setLoading(true);
    try {
      // TODO: Use proper types after Supabase regeneration
      const { error } = await (supabase as any)
        .from('reward_requests')
        .insert({
          user_id: user.id,
          definition_id: reward.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Your reward request has been submitted. We'll process it soon!",
      });

      onRequestSubmitted();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!reward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request Your Reward
          </DialogTitle>
          <DialogDescription>
            Fill out your shipping information to claim your earned reward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reward Info */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {reward.reward_image_url ? (
                <img 
                  src={reward.reward_image_url} 
                  alt={reward.reward_name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{reward.reward_name}</h3>
                <p className="text-muted-foreground text-sm">{reward.reward_description}</p>
              </div>
              {reward.request_status !== 'none' && (
                <Badge className={getStatusColor(reward.request_status)}>
                  {reward.request_status}
                </Badge>
              )}
            </div>
          </div>

          {reward.request_status === 'none' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.shipping_full_name}
                    onChange={(e) => handleInputChange('shipping_full_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange('address_line2', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal">Postal Code *</Label>
                  <Input
                    id="postal"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special delivery instructions..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Request Status: {reward.request_status}</p>
              <p className="text-muted-foreground">
                {reward.request_status === 'pending' && "Your request is being processed."}
                {reward.request_status === 'approved' && "Your request has been approved and will ship soon!"}
                {reward.request_status === 'shipped' && "Your reward is on its way!"}
                {reward.request_status === 'rejected' && "Your request was not approved. Please contact support."}
                {reward.request_status === 'cancelled' && "This request has been cancelled."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}