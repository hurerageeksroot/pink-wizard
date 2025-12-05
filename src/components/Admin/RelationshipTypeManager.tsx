import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useEnhancedRelationshipTypes, RELATIONSHIP_INTENT_CONFIGS } from "@/hooks/useEnhancedRelationshipTypes";
import { EnhancedRelationshipTypeCreate, RelationshipIntent } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIconComponent } from "@/utils/iconMapping";

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
  'GraduationCap', 'Home', 'MapPin', 'Globe', 'Camera', 'Music', 'Palette', 'Coffee'
];

export function RelationshipTypeManager() {
  const { relationshipTypes, isLoading, addRelationshipType, deleteRelationshipType, RELATIONSHIP_INTENT_CONFIGS } = useEnhancedRelationshipTypes();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState<EnhancedRelationshipTypeCreate>({
    name: '',
    label: '',
    iconName: 'Users',
    colorClass: colorOptions[0].value,
    relationshipIntent: 'business_lead_statuses',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRelationshipType.name.trim() || !newRelationshipType.label.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addRelationshipType(newRelationshipType);
      toast({
        title: "Success",
        description: "Relationship type added successfully!",
      });
      setNewRelationshipType({
        name: '',
        label: '',
        iconName: 'Users',
        colorClass: colorOptions[0].value,
        relationshipIntent: 'business_lead_statuses',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding relationship type:', error);
      toast({
        title: "Error",
        description: "Failed to add relationship type. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default relationship types cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteRelationshipType(id);
      toast({
        title: "Success",
        description: "Relationship type deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting relationship type:', error);
      toast({
        title: "Error",
        description: "Failed to delete relationship type. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading relationship types...</div>;
  }

  // Group types by relationship intent
  const typesByIntent = Object.keys(RELATIONSHIP_INTENT_CONFIGS).reduce((acc, intent) => {
    acc[intent as RelationshipIntent] = relationshipTypes.filter(rt => rt.relationshipIntent === intent);
    return acc;
  }, {} as Record<RelationshipIntent, typeof relationshipTypes>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Relationship Type Management</CardTitle>
        <CardDescription>
          Organize your contacts by relationship intent and create custom types for different contexts: business, personal, civic, services, and community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your Relationship Types</h3>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Relationship Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Relationship Type</DialogTitle>
                  <DialogDescription>
                    Create a custom relationship type for your contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (internal identifier) *</Label>
                    <Input
                      id="name"
                      value={newRelationshipType.name}
                      onChange={(e) => setNewRelationshipType(prev => ({ 
                        ...prev, 
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      }))}
                      placeholder="e.g., school_board_member"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Label *</Label>
                    <Input
                      id="label"
                      value={newRelationshipType.label}
                      onChange={(e) => setNewRelationshipType(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., School Board Member"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationshipIntent">Relationship Intent *</Label>
                    <Select 
                      value={newRelationshipType.relationshipIntent} 
                      onValueChange={(value) => setNewRelationshipType(prev => ({ ...prev, relationshipIntent: value as RelationshipIntent }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RELATIONSHIP_INTENT_CONFIGS).map(([intent, config]) => (
                          <SelectItem key={intent} value={intent}>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded mr-2 ${config.colorClass}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
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
                          const IconComponent = getIconComponent(iconName);
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

        <Tabs defaultValue="business_lead" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {Object.entries(RELATIONSHIP_INTENT_CONFIGS).map(([intent, config]) => {
              const IconComponent = getIconComponent(config.iconName);
              return (
                <TabsTrigger key={intent} value={intent} className="flex items-center space-x-1">
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(RELATIONSHIP_INTENT_CONFIGS).map(([intent, config]) => (
            <TabsContent key={intent} value={intent}>
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium">{config.label}</h4>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {typesByIntent[intent as RelationshipIntent]?.map((relationshipType) => {
                    const IconComponent = getIconComponent(relationshipType.iconName);
                    return (
                      <div key={relationshipType.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Badge className={relationshipType.colorClass}>
                            <IconComponent className="w-3 h-3 mr-1" />
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
                            onClick={() => handleDelete(relationshipType.id, relationshipType.isDefault)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {(!typesByIntent[intent as RelationshipIntent] || typesByIntent[intent as RelationshipIntent].length === 0) && (
                    <p className="text-muted-foreground text-sm col-span-2">No {config.label.toLowerCase()} types defined.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}