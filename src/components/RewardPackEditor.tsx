import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

interface RewardItem {
  id?: string;
  name: string;
  description: string;
  reward_type: 'points' | 'badge' | 'bonus_multiplier' | 'exclusive_content';
  weight: number;
  reward_data: any;
}

interface RewardPackEditorProps {
  rewardPack?: any;
  onSave: (rewardPack: any) => void;
  onCancel: () => void;
}

export const RewardPackEditor: React.FC<RewardPackEditorProps> = ({
  rewardPack,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_criteria: {
      event: 'contact_added',
      probability: 0.1
    },
    is_active: true
  });
  
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);

  useEffect(() => {
    if (rewardPack) {
      setFormData({
        name: rewardPack.name || '',
        description: rewardPack.description || '',
        trigger_criteria: rewardPack.trigger_criteria || {
          event: 'contact_added',
          probability: 0.1
        },
        is_active: rewardPack.is_active !== false
      });
      setRewardItems(rewardPack.items || []);
    }
  }, [rewardPack]);

  const addRewardItem = () => {
    setRewardItems([...rewardItems, {
      name: '',
      description: '',
      reward_type: 'points',
      weight: 1,
      reward_data: { points: 100 }
    }]);
  };

  const removeRewardItem = (index: number) => {
    setRewardItems(rewardItems.filter((_, i) => i !== index));
  };

  const updateRewardItem = (index: number, field: string, value: any) => {
    const updated = [...rewardItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update reward_data based on type
    if (field === 'reward_type') {
      switch (value) {
        case 'points':
          updated[index].reward_data = { points: 100 };
          break;
        case 'badge':
          updated[index].reward_data = { badge_name: 'Achievement Unlocked' };
          break;
        case 'bonus_multiplier':
          updated[index].reward_data = { multiplier: 1.5, duration_minutes: 30 };
          break;
        case 'exclusive_content':
          updated[index].reward_data = { content_type: 'tip', content_title: 'Pro Tip' };
          break;
      }
    }
    
    setRewardItems(updated);
  };

  const handleSave = () => {
    const packData = {
      ...formData,
      items: rewardItems
    };
    onSave(packData);
  };

  const achievementEvents = [
    { value: 'contact_added', label: 'Contact Added' },
    { value: 'daily_activity', label: 'Daily Activity' },
    { value: 'activity_completed', label: 'Activity Completed' },
    { value: 'follow_up_completed', label: 'Follow Up Completed' },
    { value: 'contact_won', label: 'Contact Won' },
    { value: 'deal_closed', label: 'Deal Closed' },
    { value: 'revenue_milestone', label: 'Revenue Milestone' },
    { value: 'networking_event', label: 'Networking Event' },
    { value: 'networking_event_logged', label: 'Networking Event Logged' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pack-name">Pack Name</Label>
          <Input
            id="pack-name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Winner's Bonus Pack"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trigger-event">Achievement Trigger</Label>
          <Select 
            value={formData.trigger_criteria.event} 
            onValueChange={(value) => setFormData({
              ...formData, 
              trigger_criteria: {...formData.trigger_criteria, event: value}
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select achievement" />
            </SelectTrigger>
            <SelectContent>
              {achievementEvents.map(event => (
                <SelectItem key={event.value} value={event.value}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pack-description">Description</Label>
        <Textarea
          id="pack-description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe when this reward pack should be triggered..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="probability">Trigger Probability (%)</Label>
        <Input
          id="probability"
          type="number"
          min="0"
          max="100"
          value={(formData.trigger_criteria.probability * 100).toFixed(1)}
          onChange={(e) => setFormData({
            ...formData,
            trigger_criteria: {
              ...formData.trigger_criteria,
              probability: parseFloat(e.target.value) / 100
            }
          })}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reward Items</CardTitle>
            <Button onClick={addRewardItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rewardItems.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Reward Item {index + 1}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeRewardItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateRewardItem(index, 'name', e.target.value)}
                      placeholder="e.g., Bonus Points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Type</Label>
                    <Select 
                      value={item.reward_type} 
                      onValueChange={(value) => updateRewardItem(index, 'reward_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Bonus Points</SelectItem>
                        <SelectItem value="badge">Special Badge</SelectItem>
                        <SelectItem value="bonus_multiplier">Score Multiplier</SelectItem>
                        <SelectItem value="exclusive_content">Exclusive Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateRewardItem(index, 'description', e.target.value)}
                      placeholder="Describe this reward..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (Rarity)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.weight}
                      onChange={(e) => updateRewardItem(index, 'weight', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Reward-specific configuration */}
                {item.reward_type === 'points' && (
                  <div className="space-y-2">
                    <Label>Points Amount</Label>
                    <Input
                      type="number"
                      value={item.reward_data?.points || 100}
                      onChange={(e) => updateRewardItem(index, 'reward_data', {
                        ...item.reward_data,
                        points: parseInt(e.target.value)
                      })}
                    />
                  </div>
                )}

                {item.reward_type === 'bonus_multiplier' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={item.reward_data?.multiplier || 1.5}
                        onChange={(e) => updateRewardItem(index, 'reward_data', {
                          ...item.reward_data,
                          multiplier: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={item.reward_data?.duration_minutes || 30}
                        onChange={(e) => updateRewardItem(index, 'reward_data', {
                          ...item.reward_data,
                          duration_minutes: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
          
          {rewardItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reward items added yet. Click "Add Item" to create your first reward.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!formData.name.trim() || rewardItems.length === 0}>
          {rewardPack?.id ? 'Update' : 'Create'} Reward Pack
        </Button>
      </div>
    </div>
  );
};