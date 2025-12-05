import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Star, Gift, Edit, Trash2, Package, Settings, Zap, Target } from "lucide-react";
import { BadgeEditor } from "@/components/BadgeEditor";
import { RewardPackEditor } from "@/components/RewardPackEditor";
import { GuaranteedRewardEditor } from "@/components/GuaranteedRewardEditor";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useChallenge } from "@/hooks/useChallenge";

export default function GamificationManagement() {
  const { toast } = useToast();
  const { currentDay } = useChallenge();
  const [activeTab, setActiveTab] = useState("badges");
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [editingRewardPack, setEditingRewardPack] = useState<any>(null);
  const [editingGuaranteedReward, setEditingGuaranteedReward] = useState<any>(null);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);
  const [showRewardEditor, setShowRewardEditor] = useState(false);
  const [showGuaranteedEditor, setShowGuaranteedEditor] = useState(false);
  const [awardingBonus, setAwardingBonus] = useState<string | null>(null);
  
  // Data states
  const [badges, setBadges] = useState<any[]>([]);
  const [rewardPacks, setRewardPacks] = useState<any[]>([]);
  const [guaranteedRewards, setGuaranteedRewards] = useState<any[]>([]);
  const [variableRewards, setVariableRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch badges
  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges_definition')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch badges",
        variant: "destructive",
      });
    }
  };

  // Fetch reward packs
  const fetchRewardPacks = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_packs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRewardPacks(data || []);
    } catch (error) {
      console.error('Error fetching reward packs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reward packs",
        variant: "destructive",
      });
    }
  };

  // Fetch guaranteed rewards
  const fetchGuaranteedRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('guaranteed_rewards_definition')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setGuaranteedRewards(data || []);
    } catch (error) {
      console.error('Error fetching guaranteed rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch guaranteed rewards",
        variant: "destructive",
      });
    }
  };

  // Fetch variable rewards config
  const fetchVariableRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('variable_rewards_config')
        .select('*')
        .order('event_type', { ascending: true });
      
      if (error) throw error;
      setVariableRewards(data || []);
    } catch (error) {
      console.error('Error fetching variable rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch variable rewards",
        variant: "destructive",
      });
    }
  };

  // Performance bonus queries
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
  weekStart.setHours(0, 0, 0, 0);

  const { data: outreachCandidates, refetch: refetchOutreach } = useQuery({
    queryKey: ['weekly-outreach-bonus'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_outreach_bonus_candidates');
      if (error) throw error;
      return data as Array<{
        user_id: string;
        display_name: string;
        weekly_activity_count: number;
        already_awarded: boolean;
      }>;
    },
    enabled: activeTab === 'bonuses'
  });

  const { data: winsCandidates, refetch: refetchWins } = useQuery({
    queryKey: ['weekly-wins-bonus'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekly_wins_bonus_candidates');
      if (error) throw error;
      return data as Array<{
        user_id: string;
        display_name: string;
        weekly_wins: number;
        already_awarded: boolean;
      }>;
    },
    enabled: activeTab === 'bonuses'
  });

  const { data: streakCandidates, refetch: refetchStreaks } = useQuery({
    queryKey: ['streak-bonus-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_streak_bonus_candidates');
      if (error) throw error;
      return data as Array<{
        user_id: string;
        display_name: string;
        current_streak: number;
        eligible_bonus_type: string;
        bonus_points: number;
        last_streak_bonus_awarded: string | null;
      }>;
    },
    enabled: activeTab === 'bonuses'
  });

  const isLoadingOutreach = !outreachCandidates && activeTab === 'bonuses';
  const isLoadingWins = !winsCandidates && activeTab === 'bonuses';
  const isLoadingStreak = !streakCandidates && activeTab === 'bonuses';

  const handleAwardBonus = async (
    userId: string,
    displayName: string,
    activityType: string,
    points: number,
    description: string
  ) => {
    setAwardingBonus(userId);
    try {
      const { error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_activity_type: activityType,
        p_points: points,
        p_description: description,
        p_metadata: {
          awarded_by: 'admin',
          week_start: weekStart.toISOString()
        },
        p_challenge_day: currentDay
      });

      if (error) throw error;

      toast({
        title: "Bonus awarded",
        description: `Successfully awarded ${points} points to ${displayName}`
      });

      // Refresh all bonus queries
      refetchOutreach();
      refetchWins();
      refetchStreaks();
    } catch (error) {
      console.error('Error awarding bonus:', error);
      toast({
        title: "Error",
        description: "Failed to award bonus",
        variant: "destructive"
      });
    } finally {
      setAwardingBonus(null);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBadges(),
        fetchRewardPacks(),
        fetchGuaranteedRewards(),
        fetchVariableRewards()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gamification Management</h1>
        <p className="text-muted-foreground">
          Manage badges, rewards, and incentive systems
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="guaranteed" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Guaranteed Rewards
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Bonuses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Badge Management</CardTitle>
                  <CardDescription>
                    Create and manage achievement badges for user activities
                  </CardDescription>
                </div>
                <Button onClick={() => setShowBadgeEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Badge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showBadgeEditor ? (
                <BadgeEditor
                  badge={editingBadge}
                  onSave={async (badgeData) => {
                    console.log('Attempting to save badge data:', badgeData);
                    try {
                      if (editingBadge?.id) {
                        // Update existing badge
                        const { error } = await supabase
                          .from('badges_definition')
                          .update({
                            name: badgeData.name,
                            description: badgeData.description,
                            icon_name: badgeData.icon_name,
                            image_url: badgeData.image_url || null,
                            category: badgeData.category,
                            criteria: badgeData.criteria,
                            points_reward: badgeData.points_reward,
                            is_active: badgeData.is_active,
                            rarity: badgeData.rarity,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', editingBadge.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Badge updated",
                          description: "Badge has been successfully updated"
                        });
                      } else {
                        // Create new badge
                        const { error } = await supabase
                          .from('badges_definition')
                          .insert({
                            name: badgeData.name,
                            description: badgeData.description,
                            icon_name: badgeData.icon_name,
                            image_url: badgeData.image_url || null,
                            category: badgeData.category,
                            criteria: badgeData.criteria,
                            points_reward: badgeData.points_reward,
                            is_active: badgeData.is_active,
                            rarity: badgeData.rarity
                          });
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Badge created",
                          description: "New badge has been successfully created"
                        });
                      }
                      
                      setShowBadgeEditor(false);
                      setEditingBadge(null);
                      fetchBadges();
                    } catch (error) {
                      console.error('Error saving badge:', error);
                      toast({
                        title: "Error saving badge",
                        description: "Failed to save badge. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  onCancel={() => {
                    setShowBadgeEditor(false);
                    setEditingBadge(null);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading badges...</p>
                    </div>
                  ) : badges.length > 0 ? (
                    <div className="grid gap-4">
                      {badges.map((badge) => (
                        <div key={badge.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Trophy className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{badge.name}</h4>
                              <p className="text-sm text-muted-foreground">{badge.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{badge.category}</Badge>
                                <Badge variant="secondary" className="text-xs">{badge.rarity}</Badge>
                                <span className="text-xs text-muted-foreground">{badge.points_reward} pts</span>
                                {!badge.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingBadge(badge);
                                setShowBadgeEditor(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No badges configured. Create your first badge to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variable Rewards</CardTitle>
                  <CardDescription>
                    Manage dynamic reward systems and probability-based rewards
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingRewardPack(null);
                  setShowRewardEditor(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Reward Pack
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showRewardEditor ? (
                <RewardPackEditor
                  rewardPack={editingRewardPack}
                  onSave={async (rewardData) => {
                    try {
                      if (editingRewardPack?.id) {
                        // Update existing reward pack
                        const { error } = await supabase
                          .from('reward_packs')
                          .update({
                            name: rewardData.name,
                            description: rewardData.description,
                            trigger_criteria: rewardData.trigger_criteria,
                            is_active: rewardData.is_active,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', editingRewardPack.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Reward pack updated",
                          description: "Reward pack has been successfully updated"
                        });
                      } else {
                        // Create new reward pack
                        const { error } = await supabase
                          .from('reward_packs')
                          .insert({
                            name: rewardData.name,
                            description: rewardData.description,
                            trigger_criteria: rewardData.trigger_criteria,
                            is_active: rewardData.is_active
                          });
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Reward pack created",
                          description: "New reward pack has been successfully created"
                        });
                      }
                      
                      setShowRewardEditor(false);
                      setEditingRewardPack(null);
                      fetchRewardPacks();
                    } catch (error) {
                      console.error('Error saving reward pack:', error);
                      toast({
                        title: "Error saving reward pack",
                        description: "Failed to save reward pack. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  onCancel={() => {
                    setShowRewardEditor(false);
                    setEditingRewardPack(null);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading reward packs...</p>
                    </div>
                  ) : rewardPacks.length > 0 ? (
                    <div className="grid gap-4">
                      {rewardPacks.map((pack) => (
                        <div key={pack.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg">
                              <Package className="h-5 w-5 text-secondary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{pack.name}</h4>
                              <p className="text-sm text-muted-foreground">{pack.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {pack.trigger_criteria?.event || 'No trigger'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {((pack.trigger_criteria?.probability || 0) * 100).toFixed(1)}% chance
                                </span>
                                {!pack.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingRewardPack(pack);
                                setShowRewardEditor(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No reward packs configured. Create your first reward pack to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable Rewards Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variable Rewards Configuration</CardTitle>
                  <CardDescription>
                    Configure probability-based rewards for different user activities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading variable rewards...</p>
                  </div>
                ) : variableRewards.length > 0 ? (
                  <div className="grid gap-4">
                    {variableRewards.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Settings className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">{config.event_type.replace(/_/g, ' ')}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Base: {(config.base_probability * 100).toFixed(1)}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Streak: {config.streak_multiplier}x
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Performance: {config.performance_multiplier}x
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {config.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Switch
                              checked={config.is_active}
                              onCheckedChange={async (checked) => {
                                try {
                                  const { error } = await supabase
                                    .from('variable_rewards_config')
                                    .update({ 
                                      is_active: checked,
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('id', config.id);

                                  if (error) throw error;

                                  toast({
                                    title: `Variable reward ${checked ? 'activated' : 'deactivated'}`,
                                    description: `${config.event_type.replace(/_/g, ' ')} rewards are now ${checked ? 'active' : 'inactive'}`
                                  });

                                  fetchVariableRewards();
                                } catch (error) {
                                  console.error('Error updating variable reward:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to update variable reward status",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No variable reward configurations found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guaranteed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Guaranteed Rewards</CardTitle>
                  <CardDescription>
                    Set up milestone-based guaranteed rewards for user achievements
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingGuaranteedReward(null);
                  setShowGuaranteedEditor(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Guaranteed Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showGuaranteedEditor ? (
                <GuaranteedRewardEditor
                  reward={editingGuaranteedReward}
                  isOpen={showGuaranteedEditor}
                  onClose={() => {
                    setShowGuaranteedEditor(false);
                    setEditingGuaranteedReward(null);
                  }}
                  onSave={async (rewardData) => {
                    try {
                      if (editingGuaranteedReward?.id) {
                        // Update existing guaranteed reward
                        const { error } = await supabase
                          .from('guaranteed_rewards_definition')
                          .update({
                            name: rewardData.name,
                            description: rewardData.description,
                            metric_key: rewardData.metric_key,
                            threshold: rewardData.threshold,
                            reward_name: rewardData.reward_name,
                            reward_description: rewardData.reward_description,
                            shipping_required: rewardData.shipping_required,
                            is_active: rewardData.is_active,
                            sort_order: rewardData.sort_order,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', editingGuaranteedReward.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Guaranteed reward updated",
                          description: "Guaranteed reward has been successfully updated"
                        });
                      } else {
                        // Create new guaranteed reward
                        const { error } = await supabase
                          .from('guaranteed_rewards_definition')
                          .insert({
                            name: rewardData.name,
                            description: rewardData.description,
                            metric_key: rewardData.metric_key,
                            threshold: rewardData.threshold,
                            reward_name: rewardData.reward_name,
                            reward_description: rewardData.reward_description,
                            shipping_required: rewardData.shipping_required,
                            is_active: rewardData.is_active,
                            sort_order: rewardData.sort_order || 0
                          });
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Guaranteed reward created",
                          description: "New guaranteed reward has been successfully created"
                        });
                      }
                      
                      setShowGuaranteedEditor(false);
                      setEditingGuaranteedReward(null);
                      fetchGuaranteedRewards();
                    } catch (error) {
                      console.error('Error saving guaranteed reward:', error);
                      toast({
                        title: "Error saving guaranteed reward",
                        description: "Failed to save guaranteed reward. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading guaranteed rewards...</p>
                    </div>
                  ) : guaranteedRewards.length > 0 ? (
                    <div className="grid gap-4">
                      {guaranteedRewards.map((reward) => (
                        <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg">
                              <Gift className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-medium">{reward.name}</h4>
                              <p className="text-sm text-muted-foreground">{reward.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{reward.metric_key}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Threshold: {reward.threshold}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {reward.reward_name}
                                </Badge>
                                {reward.shipping_required && (
                                  <Badge variant="outline" className="text-xs">Shipping Required</Badge>
                                )}
                                {!reward.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingGuaranteedReward(reward);
                                setShowGuaranteedEditor(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No guaranteed rewards configured. Create your first guaranteed reward to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-6">
          <div className="space-y-6">
            {/* Weekly Outreach Bonus Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Weekly Outreach Bonus (100 pts)
                </CardTitle>
                <CardDescription>
                  Users with 500+ outreach points this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOutreach ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : outreachCandidates?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users qualify this week
                  </p>
                ) : (
                  <div className="space-y-2">
                    {outreachCandidates?.map((candidate) => (
                      <div
                        key={candidate.user_id}
                        className="flex justify-between items-center p-4 border rounded-lg bg-card"
                      >
                        <div>
                          <p className="font-medium">{candidate.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {candidate.weekly_activity_count} outreach points
                          </p>
                        </div>
                        {candidate.already_awarded ? (
                          <Badge variant="secondary">Already Awarded</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAwardBonus(
                                candidate.user_id,
                                candidate.display_name,
                                'weekly_outreach_bonus',
                                100,
                                `Weekly outreach bonus: ${candidate.weekly_activity_count} points`
                              )
                            }
                            disabled={awardingBonus === candidate.user_id}
                          >
                            {awardingBonus === candidate.user_id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                Awarding...
                              </>
                            ) : (
                              'Award 100 pts'
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Wins Bonus Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Weekly Wins Bonus (150 pts)
                </CardTitle>
                <CardDescription>
                  Users with 5+ contacts marked as "won" this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWins ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : winsCandidates?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users qualify this week
                  </p>
                ) : (
                  <div className="space-y-2">
                    {winsCandidates?.map((candidate) => (
                      <div
                        key={candidate.user_id}
                        className="flex justify-between items-center p-4 border rounded-lg bg-card"
                      >
                        <div>
                          <p className="font-medium">{candidate.display_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {candidate.weekly_wins} wins this week
                          </p>
                        </div>
                        {candidate.already_awarded ? (
                          <Badge variant="secondary">Already Awarded</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAwardBonus(
                                candidate.user_id,
                                candidate.display_name,
                                'weekly_wins_bonus',
                                150,
                                `Weekly wins bonus: ${candidate.weekly_wins} wins`
                              )
                            }
                            disabled={awardingBonus === candidate.user_id}
                          >
                            {awardingBonus === candidate.user_id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                Awarding...
                              </>
                            ) : (
                              'Award 150 pts'
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Streak Bonuses Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Streak Bonuses
                </CardTitle>
                <CardDescription>
                  7+ days: 50 pts | 14+ days: 150 pts | 30+ days: 300 pts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStreak ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : streakCandidates?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users qualify for streak bonuses
                  </p>
                ) : (
                  <div className="space-y-2">
                    {streakCandidates?.map((candidate) => {
                      const hasAwardedThisLevel =
                        candidate.last_streak_bonus_awarded === candidate.eligible_bonus_type;
                      
                      return (
                        <div
                          key={candidate.user_id}
                          className="flex justify-between items-center p-4 border rounded-lg bg-card"
                        >
                          <div>
                            <p className="font-medium">{candidate.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {candidate.current_streak} day streak
                              {candidate.last_streak_bonus_awarded && (
                                <span className="ml-2 text-xs">
                                  (Last awarded: {candidate.last_streak_bonus_awarded.replace('streak_bonus_', '')} days)
                                </span>
                              )}
                            </p>
                          </div>
                          {hasAwardedThisLevel ? (
                            <Badge variant="secondary">Already Awarded</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAwardBonus(
                                  candidate.user_id,
                                  candidate.display_name,
                                  candidate.eligible_bonus_type,
                                  candidate.bonus_points,
                                  `Streak bonus: ${candidate.current_streak} day streak`
                                )
                              }
                              disabled={awardingBonus === candidate.user_id}
                            >
                              {awardingBonus === candidate.user_id ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                  Awarding...
                                </>
                              ) : (
                                `Award ${candidate.bonus_points} pts`
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}