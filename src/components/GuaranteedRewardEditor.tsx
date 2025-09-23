import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface GuaranteedRewardDefinition {
  id?: string;
  name: string;
  description: string;
  metric_key: string;
  threshold: number;
  reward_name: string;
  reward_description: string;
  reward_image_url?: string;
  shipping_required: boolean;
  is_active: boolean;
  sort_order: number;
}

interface GuaranteedRewardEditorProps {
  reward: GuaranteedRewardDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: Partial<GuaranteedRewardDefinition>) => void;
}

const metricOptions = [
  { value: 'total_revenue', label: 'Total Revenue ($)', description: 'Sum of all revenue logged' },
  { value: 'contacts_won', label: 'Contacts Won', description: 'Number of contacts marked as won' },
  { value: 'contacts_added', label: 'Contacts Added', description: 'Total number of contacts added' },
  { value: 'outreach_actions', label: 'Outreach Actions', description: 'Number of activities completed' },
];

export function GuaranteedRewardEditor({ reward, isOpen, onClose, onSave }: GuaranteedRewardEditorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<GuaranteedRewardDefinition>({
    name: '',
    description: '',
    metric_key: 'total_revenue',
    threshold: 0,
    reward_name: '',
    reward_description: '',
    reward_image_url: '',
    shipping_required: true,
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    if (reward) {
      setFormData(reward);
    } else {
      setFormData({
        name: '',
        description: '',
        metric_key: 'total_revenue',
        threshold: 0,
        reward_name: '',
        reward_description: '',
        reward_image_url: '',
        shipping_required: true,
        is_active: true,
        sort_order: 0,
      });
    }
  }, [reward, isOpen]);

  const handleChange = (field: keyof GuaranteedRewardDefinition, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.reward_name || formData.threshold <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and set a positive threshold.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
  };

  const selectedMetric = metricOptions.find(opt => opt.value === formData.metric_key);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reward ? 'Edit Guaranteed Reward' : 'Create Guaranteed Reward'}
          </DialogTitle>
          <DialogDescription>
            Set up milestone rewards that users earn automatically when reaching thresholds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Internal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., First $10k Revenue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Display Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Internal description of this milestone"
              />
            </div>
          </div>

          {/* Milestone Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Milestone Criteria</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric_key">Metric Type *</Label>
                <Select value={formData.metric_key} onValueChange={(value) => handleChange('metric_key', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metricOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="threshold">Threshold *</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.threshold || ''}
                  onChange={(e) => handleChange('threshold', parseFloat(e.target.value) || 0)}
                  placeholder={selectedMetric?.value === 'total_revenue' ? "10000" : "50"}
                  min="0"
                  step={selectedMetric?.value === 'total_revenue' ? "100" : "1"}
                  required
                />
                {selectedMetric && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMetric.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reward Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reward Details</h3>
            
            <div>
              <Label htmlFor="reward_name">Reward Name *</Label>
              <Input
                id="reward_name"
                value={formData.reward_name}
                onChange={(e) => handleChange('reward_name', e.target.value)}
                placeholder="e.g., Custom Logo T-Shirt"
                required
              />
            </div>

            <div>
              <Label htmlFor="reward_description">Reward Description *</Label>
              <Textarea
                id="reward_description"
                value={formData.reward_description}
                onChange={(e) => handleChange('reward_description', e.target.value)}
                placeholder="What the user will receive - this is shown to users"
                required
              />
            </div>

            <div>
              <Label htmlFor="reward_image_url">Reward Image URL (Optional)</Label>
              <Input
                id="reward_image_url"
                type="url"
                value={formData.reward_image_url || ''}
                onChange={(e) => handleChange('reward_image_url', e.target.value)}
                placeholder="https://example.com/reward-image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="shipping_required"
                checked={formData.shipping_required}
                onCheckedChange={(checked) => handleChange('shipping_required', checked)}
              />
              <Label htmlFor="shipping_required">
                Requires Shipping Address
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.shipping_required ? 
                  'Users will need to provide shipping info to claim' : 
                  'Reward will be marked as claimed automatically'
                }
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
              <Label htmlFor="is_active">
                Active
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {reward ? 'Update Reward' : 'Create Reward'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}