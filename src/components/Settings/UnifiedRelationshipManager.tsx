import { useState } from 'react';
import { RelationshipIntent } from '@/types/crm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRelationshipCategoryPreferences } from '@/hooks/useRelationshipCategoryPreferences';
import { useEnhancedRelationshipTypes } from '@/hooks/useEnhancedRelationshipTypes';
import { RelationshipCategorySelector } from '@/components/RelationshipCategorySelector';
import { Plus, Trash2, Briefcase, Heart, Shield, User, Building, Newspaper, RefreshCw, Info } from 'lucide-react';
import * as Icons from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const iconOptions = [
  'Briefcase', 'Heart', 'Shield', 'User', 'Building', 'Newspaper',
  'Star', 'Award', 'Target', 'Users', 'Handshake', 'TrendingUp'
];

const colorOptions = [
  { value: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Blue' },
  { value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Green' },
  { value: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', label: 'Purple' },
  { value: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'Orange' },
  { value: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300', label: 'Pink' },
  { value: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300', label: 'Teal' },
];

const categoryIcons: Record<string, React.ComponentType<any>> = {
  business: Briefcase,
  personal: Heart,
  service_provider: Shield,
  other_misc: User,
  civic_community: Building,
  philanthropy_nonprofit: Heart,
  media_press: Newspaper,
};

export function UnifiedRelationshipManager() {
  const { user } = useAuth();
  const {
    categoryPreferences,
    loading: categoriesLoading,
    enabledCategories,
    disabledCategories,
    availableCategories,
    updateCategory,
    enableCategories,
    getCategoryConfig,
    isUpdating
  } = useRelationshipCategoryPreferences();

  const {
    relationshipTypes,
    isLoading: typesLoading,
    addRelationshipType,
    deleteRelationshipType,
    getTypesByIntent,
    reload
  } = useEnhancedRelationshipTypes();

  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState<{
    name: string;
    label: string;
    relationshipIntent: RelationshipIntent;
    iconName: string;
    colorClass: string;
  }>({
    name: '',
    label: '',
    relationshipIntent: 'business_lead_statuses',
    iconName: 'Briefcase',
    colorClass: colorOptions[0].value
  });

  // Map category names to their associated intents
  const categoryToIntentMap: Record<string, RelationshipIntent[]> = {
    business: ['business_lead_statuses', 'business_nurture_statuses'],
    personal: ['personal_statuses'],
    service_provider: ['vendor_statuses'],
    civic_community: ['civic_statuses'],
    philanthropy_nonprofit: ['civic_statuses'],
    media_press: ['civic_statuses'],
    other_misc: ['other_misc']
  };

  const handleDisableCategory = async (categoryName: string) => {
    const enabledCount = enabledCategories.length;
    if (enabledCount <= 1) {
      toast({
        title: 'Cannot disable',
        description: 'You must have at least one category enabled',
        variant: 'destructive'
      });
      return;
    }
    updateCategory({ categoryName, isEnabled: false });
  };

  const handleEnableCategory = async (categoryName: string) => {
    enableCategories([categoryName]);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const enabledCategoryNames = enabledCategories.map(c => c.category_name);
      const results = await Promise.all(
        enabledCategoryNames.map(async (categoryName) => {
          const { data, error } = await supabase.rpc('seed_relationship_types_for_category', {
            p_user_id: user?.id,
            p_category_name: categoryName
          });
          if (error) throw error;
          return data || 0;
        })
      );

      const totalSeeded = results.reduce((sum, count) => sum + count, 0);
      await reload();

      toast({
        title: 'Sync complete',
        description: totalSeeded > 0 
          ? `Added ${totalSeeded} new relationship type${totalSeeded !== 1 ? 's' : ''}`
          : 'All relationship types are up to date'
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync relationship types',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddType = async () => {
    if (!newRelationshipType.label.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a label',
        variant: 'destructive'
      });
      return;
    }

    if (!newRelationshipType.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter an internal name',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addRelationshipType({
        name: newRelationshipType.name,
        label: newRelationshipType.label,
        relationshipIntent: newRelationshipType.relationshipIntent,
        iconName: newRelationshipType.iconName,
        colorClass: newRelationshipType.colorClass
      });

      setShowAddTypeDialog(false);
      setNewRelationshipType({
        name: '',
        label: '',
        relationshipIntent: 'business_lead_statuses',
        iconName: 'Briefcase',
        colorClass: colorOptions[0].value
      });

      toast({
        title: 'Success',
        description: 'Relationship type added successfully'
      });
    } catch (error) {
      console.error('Failed to add type:', error);
      toast({
        title: 'Error',
        description: 'Failed to add relationship type',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteType = async (typeId: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: 'Cannot delete',
        description: 'Default relationship types cannot be deleted',
        variant: 'destructive'
      });
      return;
    }

    try {
      await deleteRelationshipType(typeId);
      toast({
        title: 'Success',
        description: 'Relationship type deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete type:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete relationship type',
        variant: 'destructive'
      });
    }
  };

  const handleLabelChange = (value: string) => {
    setNewRelationshipType(prev => ({
      ...prev,
      label: value,
      name: value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    }));
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Circle;
  };

  const getTypesCountForCategory = (categoryName: string) => {
    const intents = categoryToIntentMap[categoryName] || [];
    return relationshipTypes.filter(type => 
      intents.includes(type.relationshipIntent)
    ).length;
  };

  const intentLabels: Record<RelationshipIntent, string> = {
    business_lead_statuses: 'Business Lead Statuses',
    business_nurture_statuses: 'Business Nurture Statuses',
    personal_statuses: 'Personal Statuses',
    vendor_statuses: 'Vendor & Supplier Statuses',
    civic_statuses: 'Civic & Community Statuses',
    other_misc: 'Other / Miscellaneous Statuses'
  };

  if (categoriesLoading || typesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Relationship Management</CardTitle>
            <CardDescription>
              Enable categories and customize relationship types
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Types
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={enabledCategories.map(c => c.category_name)} className="space-y-2">
          {/* Enabled Categories */}
          {enabledCategories.map((category) => {
            const config = getCategoryConfig(category.category_name);
            const CategoryIcon = categoryIcons[category.category_name] || User;
            const intents = categoryToIntentMap[category.category_name] || [];
            const typeCount = getTypesCountForCategory(category.category_name);

            return (
              <AccordionItem key={category.id} value={category.category_name} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{category.category_label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeCount} {typeCount === 1 ? 'type' : 'types'}
                      </Badge>
                    </div>
                    <Switch
                      checked={true}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          handleDisableCategory(category.category_name);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-4"
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {intents.map((intent) => {
                    const types = getTypesByIntent(intent);
                    if (types.length === 0) return null;

                    return (
                      <div key={intent} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            {intentLabels[intent]}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {types.map((type) => {
                            const TypeIcon = getIconComponent(type.iconName || 'Circle');
                            return (
                              <div key={type.id} className="group relative">
                                <Badge
                                  variant="outline"
                                  className={`${type.colorClass} flex items-center gap-1.5 pr-1`}
                                >
                                  <TypeIcon className="h-3.5 w-3.5" />
                                  {type.label}
                                  {!type.isDefault && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 ml-1 opacity-0 group-hover:opacity-100"
                                      onClick={() => handleDeleteType(type.id, type.isDefault)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      const firstIntent = intents[0];
                      if (firstIntent) {
                        setNewRelationshipType(prev => ({
                          ...prev,
                          relationshipIntent: firstIntent
                        }));
                      }
                      setShowAddTypeDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Type
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Disabled Categories */}
        {disabledCategories.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Disabled Categories</h3>
              {disabledCategories.map((category) => {
                const config = getCategoryConfig(category.category_name);
                const CategoryIcon = categoryIcons[category.category_name] || User;

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3 opacity-60">
                      <CategoryIcon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{category.category_label}</div>
                        {config && (
                          <div className="text-xs text-muted-foreground">{config.description}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleEnableCategory(category.category_name)}
                      disabled={isUpdating}
                    >
                      Enable
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Discover More Categories */}
        {availableCategories.length > 0 && (
          <>
            <Separator />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowDiscoverModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Discover More Categories
            </Button>
          </>
        )}

        {/* Info about syncing */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Use "Sync Types" to import the latest default relationship types for your enabled categories.
          </p>
        </div>
      </CardContent>

      {/* Add Custom Type Dialog */}
      <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Relationship Type</DialogTitle>
            <DialogDescription>
              Create a new relationship type for your contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Display Label</Label>
              <Input
                id="label"
                value={newRelationshipType.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., VIP Client"
              />
            </div>
            <div>
              <Label htmlFor="name">Internal Name</Label>
              <Input
                id="name"
                value={newRelationshipType.name}
                onChange={(e) => setNewRelationshipType(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., vip_client"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated from label, can be customized
              </p>
            </div>
            <div>
              <Label htmlFor="intent">Category</Label>
              <Select
                value={newRelationshipType.relationshipIntent}
                onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, relationshipIntent: value as RelationshipIntent }))}
              >
                <SelectTrigger id="intent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledCategories.flatMap((category) => {
                    const intents = categoryToIntentMap[category.category_name] || [];
                    return intents.map((intent) => (
                      <SelectItem key={intent} value={intent}>
                        {intentLabels[intent]}
                      </SelectItem>
                    ));
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={newRelationshipType.iconName}
                onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, iconName: value }))}
              >
                <SelectTrigger id="icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {iconName}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Select
                value={newRelationshipType.colorClass}
                onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, colorClass: value }))}
              >
                <SelectTrigger id="color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${option.value}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddType}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discover More Categories Dialog */}
      <Dialog open={showDiscoverModal} onOpenChange={setShowDiscoverModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discover More Relationship Categories</DialogTitle>
            <DialogDescription>
              Enable additional categories to expand your relationship management capabilities
            </DialogDescription>
          </DialogHeader>
          <RelationshipCategorySelector
            onComplete={() => {
              setShowDiscoverModal(false);
              toast({
                title: 'Categories enabled',
                description: 'New categories have been added successfully'
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
