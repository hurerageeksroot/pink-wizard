import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Star, X, Check } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { AnimatePresence, motion } from "framer-motion";

interface RewardNotification {
  id: string;
  type: 'badge' | 'reward';
  title: string;
  description: string;
  rarity?: string;
  points?: number;
  timestamp: Date;
}

export function RewardNotifications() {
  const { rewards, claimReward } = useGamification();
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get unclaimed rewards
  const unclaimedRewards = rewards.filter(r => !r.is_claimed);

  useEffect(() => {
    if (unclaimedRewards.length > 0) {
      setShowNotifications(true);
    }
  }, [unclaimedRewards.length]);

  const handleClaimReward = async (rewardId: string) => {
    const success = await claimReward(rewardId);
    if (success) {
      // Remove from notifications
      setNotifications(prev => prev.filter(n => n.id !== rewardId));
    }
  };

  const handleDismissNotifications = () => {
    setShowNotifications(false);
  };

  if (!showNotifications || unclaimedRewards.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm space-y-3"
      >
        {unclaimedRewards.slice(0, 3).map((reward) => (
          <motion.div
            key={reward.id}
            layout
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Card className="bg-gradient-card border-2 border-primary/20 shadow-lg backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                   <div className="p-2 bg-primary text-primary-foreground rounded-lg shrink-0">
                     {reward.reward_type === 'badge' ? (
                       <Trophy className="h-5 w-5" />
                     ) : (
                       <Gift className="h-5 w-5" />
                     )}
                   </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">
                        🎉 {reward.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={handleDismissNotifications}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {reward.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {reward.reward_data?.points && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {reward.reward_data.points} pts
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className="text-xs capitalize"
                        >
                          {reward.reward_type}
                        </Badge>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleClaimReward(reward.id)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 h-7 text-xs shadow-md"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Claim
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Sparkle effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 right-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                  <div className="absolute top-4 right-6 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-pulse delay-300" />
                  <div className="absolute bottom-4 left-4 w-1 h-1 bg-yellow-500 rounded-full animate-bounce delay-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Show count if more than 3 rewards */}
        {unclaimedRewards.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Badge variant="secondary" className="text-xs">
              +{unclaimedRewards.length - 3} more rewards
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}