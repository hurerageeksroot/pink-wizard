import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useEnhancedRelationshipTypes, RELATIONSHIP_INTENT_CONFIGS } from "@/hooks/useEnhancedRelationshipTypes";
import { useRelationshipCategoryPreferences } from "@/hooks/useRelationshipCategoryPreferences";
import { EnhancedRelationshipTypeCreate, RelationshipIntent } from "@/types/crm";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const colorOptions = [
  { value: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800', label: 'Orange' },
  { value: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800', label: 'Blue' },
  { value: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800', label: 'Green' },
  { value: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800', label: 'Purple' },
  { value: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800', label: 'Pink' },
  { value: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800', label: 'Yellow' },
  { value: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', label: 'Red' },
  { value: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', label: 'Emerald' },
  { value: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800', label: 'Cyan' },
  { value: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800', label: 'Gray' },
];

const iconOptions = [
  'Users', 'Target', 'Heart', 'Handshake', 'Share2', 'UserCheck', 'Building', 'Phone', 'Mail', 
  'MessageSquare', 'Calendar', 'Clock', 'Star', 'Award', 'Crown', 'Shield', 'Briefcase', 
  'GraduationCap', 'Home', 'MapPin', 'Globe', 'Camera', 'Music', 'Palette', 'Coffee', 'Gift',
  'Newspaper', 'Zap', 'Flame', 'Lightbulb', 'Rocket', 'Trophy', 'Flag'
];

export function RelationshipTypeEditor() {
  const { relationshipTypes, isLoading, addRelationshipType, deleteRelationshipType } = useEnhancedRelationshipTypes();
  const { enabledCategories } = useRelationshipCategoryPreferences();

  const [showForm, setShowForm] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState<EnhancedRelationshipTypeCreate>({
    name: '',
    label: '',
    iconName: 'Users',
    colorClass: colorOptions[0].value,
    relationshipIntent: 'business_lead_statuses',
  });

  // Map category names to relationship intents - UPDATED FOR NEW INTENTS
  const categoryToIntentMap: Record<string, RelationshipIntent[]> = {
    'business': ['business_lead_statuses', 'business_nurture_statuses'],
    'personal': ['personal_statuses'],
    'civic_community': ['civic_statuses'],
    'service_provider': ['vendor_statuses'],
    'other_misc': ['other_misc']
  };

  // Get available intents based on enabled categories
  const availableIntents = enabledCategories.flatMap(category => 
    categoryToIntentMap[category.category_name] || []
  );

  // Filter relationship types by available intents
  const filteredRelationshipTypes = relationshipTypes.filter(rt => 
    availableIntents.includes(rt.relationshipIntent)
  );

  // Group types by intent
  const typesByIntent = availableIntents.reduce((acc, intent) => {
    acc[intent] = filteredRelationshipTypes.filter(rt => rt.relationshipIntent === intent);
    return acc;
  }, {} as Record<RelationshipIntent, typeof filteredRelationshipTypes>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRelationshipType.name.trim() || !newRelationshipType.label.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Check if the relationship intent is available for enabled categories
    if (!availableIntents.includes(newRelationshipType.relationshipIntent)) {
      toast.error("Selected category is not enabled. Please enable it first in Category Settings.");
      return;
    }

    try {
      await addRelationshipType(newRelationshipType);
      toast.success("Relationship type added successfully!");
      setNewRelationshipType({
        name: '',
        label: '',
        iconName: 'Users',
        colorClass: colorOptions[0].value,
        relationshipIntent: availableIntents[0] || 'business_lead_statuses',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding relationship type:', error);
      toast.error("Failed to add relationship type. Please try again.");
    }
  };

  const handleDelete = async (id: string, isDefault: boolean, label: string) => {
    if (isDefault) {
      toast.error("Default relationship types cannot be deleted.");
      return;
    }

    try {
      await deleteRelationshipType(id);
      toast.success(`${label} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting relationship type:', error);
      toast.error("Failed to delete relationship type. Please try again.");
    }
  };

  // Auto-generate name from label
  const handleLabelChange = (label: string) => {
    const name = label.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');
    setNewRelationshipType(prev => ({ ...prev, label, name }));
  };

  if (isLoading) {
    return <div>Loading relationship types...</div>;
  }

  if (availableIntents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customize Relationship Types</CardTitle>
          <CardDescription>
            Add custom relationship types within your enabled categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Categories Enabled</h3>
            <p className="mb-4">
              You need to enable at least one relationship category before you can customize relationship types.
            </p>
            <Button variant="outline" onClick={() => window.location.hash = '#categories'}>
              Go to Category Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Relationship Types</CardTitle>
        <CardDescription>
          Add custom relationship types within your enabled categories to better organize your contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Your Relationship Types</h3>
            <p className="text-sm text-muted-foreground">
              Organized by the categories you've enabled
            </p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Custom Relationship Type</DialogTitle>
                  <DialogDescription>
                    Create a custom relationship type for your contacts within your enabled categories.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Label *</Label>
                    <Input
                      id="label"
                      value={newRelationshipType.label}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder="e.g., Board Member, Key Volunteer, Major Donor"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Internal Name</Label>
                    <Input
                      id="name"
                      value={newRelationshipType.name}
                      onChange={(e) => setNewRelationshipType(prev => ({ 
                        ...prev, 
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      }))}
                      placeholder="Auto-generated from label"
                      className="text-muted-foreground"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      This is automatically generated from your label
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationshipIntent">Category *</Label>
                    <Select 
                      value={newRelationshipType.relationshipIntent} 
                      onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, relationshipIntent: value as RelationshipIntent }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIntents.map((intent) => {
                          const config = RELATIONSHIP_INTENT_CONFIGS[intent];
                          const IconComponent = (LucideIcons as any)[config.iconName] || LucideIcons.Users;
                          return (
                            <SelectItem key={intent} value={intent}>
                              <div className="flex items-center">
                                <IconComponent className="w-4 h-4 mr-2" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select 
                      value={newRelationshipType.iconName} 
                      onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, iconName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((iconName) => {
                          const IconComponent = (LucideIcons as any)[iconName];
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center">
                                <IconComponent className="w-4 h-4 mr-2" />
                                {iconName}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select 
                      value={newRelationshipType.colorClass} 
                      onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, colorClass: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded mr-2 border ${color.value}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Relationship Type</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {availableIntents.map((intent) => {
          const config = RELATIONSHIP_INTENT_CONFIGS[intent];
          const types = typesByIntent[intent] || [];
          const IconComponent = (LucideIcons as any)[config.iconName] || LucideIcons.Users;

          return (
            <div key={intent} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium">{config.label}</h4>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3 ml-11">
                {types.map((relationshipType) => {
                  const TypeIconComponent = (LucideIcons as any)[relationshipType.iconName] || LucideIcons.Users;
                  return (
                    <div key={relationshipType.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center space-x-2">
                        <Badge className={relationshipType.colorClass}>
                          <TypeIconComponent className="w-3 h-3 mr-1" />
                          {relationshipType.label}
                        </Badge>
                        {relationshipType.isDefault && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                      </div>
                      {!relationshipType.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(relationshipType.id, relationshipType.isDefault, relationshipType.label)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {types.length === 0 && (
                  <p className="text-muted-foreground text-sm col-span-2 py-4 text-center italic">
                    No custom types defined for {config.label.toLowerCase()}
                  </p>
                )}
              </div>
              
              {intent !== availableIntents[availableIntents.length - 1] && (
                <Separator className="my-6" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}