import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGamification } from "@/hooks/useGamification";
import { RewardRequestDialog } from "./RewardRequestDialog";
import { Package, Gift, Star, Trophy } from "lucide-react";

export function GuaranteedRewardsSection() {
  const { guaranteedRewards, fetchGuaranteedRewards } = useGamification();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const getMetricDisplayName = (metricKey: string) => {
    switch (metricKey) {
      case 'total_revenue': return 'Total Revenue';
      case 'contacts_won': return 'Contacts Won';
      case 'contacts_added': return 'Contacts Added';
      case 'outreach_actions': return 'Outreach Actions';
      default: return metricKey;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'none': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'none': return 'Ready to Claim';
      case 'pending': return 'Request Pending';
      case 'approved': return 'Approved';
      case 'shipped': return 'Shipped';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleClaimReward = (reward: any) => {
    setSelectedReward(reward);
    setShowRequestDialog(true);
  };

  const handleRequestSubmitted = () => {
    fetchGuaranteedRewards();
  };

  if (!guaranteedRewards.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Milestone Rewards
          </CardTitle>
          <CardDescription>
            Earn guaranteed rewards by reaching milestones in your challenge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No milestone rewards earned yet.</p>
            <p className="text-sm">Keep working towards your goals to unlock rewards!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Milestone Rewards ({guaranteedRewards.length})
          </CardTitle>
          <CardDescription>
            Congratulations on reaching these milestones! Claim your rewards below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guaranteedRewards.map((reward) => (
              <Card key={reward.id} className="relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(reward.request_status || 'none')}>
                    {getStatusText(reward.request_status || 'none')}
                  </Badge>
                </div>
                
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {reward.reward_image_url ? (
                      <img 
                        src={reward.reward_image_url} 
                        alt={reward.reward_name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-md flex items-center justify-center">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-lg">{reward.reward_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reward.reward_description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Earned for: {getMetricDisplayName(reward.metric_key)} ≥ {reward.threshold}
                      </div>
                      {reward.achieved_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Achieved: {new Date(reward.achieved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {reward.shipping_required && reward.request_status === 'none' && (
                      <Button 
                        onClick={() => handleClaimReward(reward)}
                        className="w-full"
                        size="sm"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Claim Reward
                      </Button>
                    )}

                    {reward.request_status === 'shipped' && (
                      <div className="text-center py-2">
                        <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                        <p className="text-sm font-medium text-green-600">
                          Reward shipped! 🎉
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <RewardRequestDialog
        reward={selectedReward}
        isOpen={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        onRequestSubmitted={handleRequestSubmitted}
      />
    </>
  );
}