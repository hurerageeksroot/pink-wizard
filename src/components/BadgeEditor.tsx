import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Crown, Target, Calendar, Zap, Users, UserPlus, DollarSign, Gem } from "lucide-react";
import { BadgeImageUpload } from "./BadgeImageUpload";

const iconOptions = [
  { name: 'Trophy', component: Trophy },
  { name: 'Star', component: Star },
  { name: 'Medal', component: Medal },
  { name: 'Crown', component: Crown },
  { name: 'Target', component: Target },
  { name: 'Calendar', component: Calendar },
  { name: 'Zap', component: Zap },
  { name: 'Users', component: Users },
  { name: 'UserPlus', component: UserPlus },
  { name: 'DollarSign', component: DollarSign },
  { name: 'Gem', component: Gem },
];

const categoryOptions = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'performance', label: 'Performance' },
  { value: 'special', label: 'Special' },
];

const rarityOptions = [
  { value: 'common', label: 'Common' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
];

const criteriaTypes = [
  { value: 'contacts_added', label: 'Contacts Added' },
  { value: 'contacts_won', label: 'Contacts Won' },
  { value: 'touchpoint_email', label: 'Email Touchpoints' },
  { value: 'touchpoint_linkedin', label: 'LinkedIn Touchpoints' },
  { value: 'touchpoint_social', label: 'Social Media Touchpoints' },
  { value: 'touchpoint_call', label: 'Phone Call Touchpoints' },
  { value: 'touchpoint_meeting', label: 'Meeting Touchpoints' },
  { value: 'touchpoint_mail', label: 'Mail Touchpoints' },
  { value: 'touchpoint_text', label: 'Text Message Touchpoints' },
  { value: 'total_revenue', label: 'Total Revenue' },
  { value: 'networking_events', label: 'Networking Events Attended' },
  { value: 'daily_streak', label: 'Daily Streak' },
];

const timeScopes = [
  { value: 'daily', label: 'In a single day' },
  { value: 'cumulative', label: 'Total across all time' },
  { value: 'streak', label: 'Consecutive days' },
];

interface BadgeDefinition {
  id?: string;
  name: string;
  description: string;
  icon_name: string;
  image_url?: string;
  category: 'milestone' | 'consistency' | 'performance' | 'special';
  criteria: any;
  points_reward: number;
  is_active: boolean;
  rarity: string;
}

interface BadgeEditorProps {
  badge: BadgeDefinition | null;
  onSave: (badge: Partial<BadgeDefinition>) => void;
  onCancel: () => void;
}

export function BadgeEditor({ badge, onSave, onCancel }: BadgeEditorProps) {
  const [formData, setFormData] = useState<BadgeDefinition>({
    name: '',
    description: '',
    icon_name: 'Trophy',
    image_url: '',
    category: 'milestone',
    criteria: { type: 'contacts_added', threshold: 1, timeScope: 'cumulative' },
    points_reward: 10,
    is_active: true,
    rarity: 'common',
  });

  useEffect(() => {
    if (badge && badge.name) {
      // Ensure criteria has all required fields
      const defaultCriteria = { type: 'contacts_added', threshold: 1, timeScope: 'cumulative' };
      const badgeCriteria = badge.criteria || defaultCriteria;
      
      setFormData({
        id: badge.id,
        name: badge.name || '',
        description: badge.description || '',
        icon_name: badge.icon_name || 'Trophy',
        image_url: badge.image_url || '',
        category: badge.category || 'milestone',
        criteria: {
          type: badgeCriteria.type || 'contacts_added',
          threshold: badgeCriteria.threshold || 1,
          timeScope: badgeCriteria.timeScope || 'cumulative'
        },
        points_reward: badge.points_reward || 10,
        is_active: badge.is_active ?? true,
        rarity: badge.rarity || 'common',
      });
    }
  }, [badge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCriteriaChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [field]: value
      }
    }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const IconComponent = iconOptions.find(icon => icon.name === formData.icon_name)?.component || Trophy;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Badge Preview */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <Label className="text-sm font-medium mb-3 block">Preview</Label>
        <div className="relative bg-gradient-card border border-border/50 rounded-lg p-4 w-fit">
          <div className={`absolute inset-0 ${getRarityColor(formData.rarity)} opacity-5 rounded-lg`} />
          <div className="relative z-10 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getRarityColor(formData.rarity)}`}>
              {formData.image_url ? (
                <img 
                  src={formData.image_url} 
                  alt="Badge" 
                  className="h-6 w-6 object-cover rounded"
                />
              ) : (
                <IconComponent className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">
                {formData.name || 'Badge Name'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formData.description || 'Badge description'}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {formData.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {formData.rarity}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formData.points_reward} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Badge Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter badge name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points">Points Reward</Label>
          <Input
            id="points"
            type="number"
            min="0"
            value={formData.points_reward}
            onChange={(e) => setFormData(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
            placeholder="10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this badge represents"
          rows={3}
        />
      </div>

      {/* Image Upload */}
      <BadgeImageUpload
        currentImageUrl={formData.image_url}
        onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, image_url: imageUrl }))}
        onImageRemoved={() => setFormData(prev => ({ ...prev, image_url: '' }))}
      />

      {/* Icon Fallback (when no image) */}
      {!formData.image_url && (
        <div className="space-y-2">
          <Label>Fallback Icon</Label>
          <Select
            value={formData.icon_name}
            onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((icon) => {
                const Icon = icon.component;
                return (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {icon.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category and Rarity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Rarity</Label>
          <Select
            value={formData.rarity}
            onValueChange={(value) => setFormData(prev => ({ ...prev, rarity: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rarityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Criteria */}
      <div className="space-y-4">
        <Label>Award Criteria</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Criteria Type</Label>
            <Select
              value={formData.criteria.type}
              onValueChange={(value) => handleCriteriaChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {criteriaTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Time Scope</Label>
            <Select
              value={formData.criteria.timeScope || 'cumulative'}
              onValueChange={(value) => handleCriteriaChange('timeScope', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeScopes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Threshold</Label>
            <Input
              type="number"
              min="1"
              value={formData.criteria.threshold || 1}
              onChange={(e) => handleCriteriaChange('threshold', parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
        </div>
        
        {/* Helper text */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <strong>Time Scope Examples:</strong><br/>
          • <strong>Daily:</strong> "Add 5 contacts in a single day"<br/>
          • <strong>Cumulative:</strong> "Add 100 total contacts"<br/>
          • <strong>Streak:</strong> "Log activities for 7 consecutive days"
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="active">Badge is active</Label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {formData.id ? 'Update Badge' : 'Create Badge'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}