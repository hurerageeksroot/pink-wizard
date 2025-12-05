import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useContactContexts } from "@/hooks/useContactContexts";
import { ContactContextCreate } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  'Tag', 'Users', 'Briefcase', 'Heart', 'Home', 'Building', 'GraduationCap', 'Camera', 'Music', 
  'Coffee', 'Car', 'Plane', 'GamepadIcon', 'Book', 'Dumbbell', 'Stethoscope', 'Palette', 
  'Globe', 'Star', 'Calendar', 'Clock', 'MapPin', 'Phone', 'Mail'
];

export function ContactContextManager() {
  const { contexts, loading, addContext, deleteContext } = useContactContexts();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newContext, setNewContext] = useState<ContactContextCreate>({
    name: '',
    label: '',
    iconName: 'Tag',
    colorClass: colorOptions[0].value,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newContext.name.trim() || !newContext.label.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addContext(newContext);
      toast({
        title: "Success",
        description: "Contact context added successfully!",
      });
      setNewContext({
        name: '',
        label: '',
        iconName: 'Tag',
        colorClass: colorOptions[0].value,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding context:', error);
      toast({
        title: "Error",
        description: "Failed to add contact context. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default contact contexts cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteContext(id);
    } catch (error) {
      console.error('Error deleting context:', error);
    }
  };

  if (loading) {
    return <div>Loading contact contexts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Context Management</CardTitle>
        <CardDescription>
          Create and manage context tags for your contacts. Contacts can have multiple contexts to better organize your network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your Contact Contexts</h3>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Context
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Contact Context</DialogTitle>
                  <DialogDescription>
                    Create a custom context tag for organizing your contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (internal identifier) *</Label>
                    <Input
                      id="name"
                      value={newContext.name}
                      onChange={(e) => setNewContext(prev => ({ 
                        ...prev, 
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      }))}
                      placeholder="e.g., school_parents"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Label *</Label>
                    <Input
                      id="label"
                      value={newContext.label}
                      onChange={(e) => setNewContext(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., School Parents"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select 
                      value={newContext.iconName} 
                      onValueChange={(value) => setNewContext(prev => ({ ...prev, iconName: value }))}
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
                      value={newContext.colorClass} 
                      onValueChange={(value) => setNewContext(prev => ({ ...prev, colorClass: value }))}
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
                  <Button type="submit">Add Context</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          <div>
            <h4 className="text-md font-medium mb-3">Available Contexts</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {contexts.map((context) => {
                const IconComponent = (LucideIcons as any)[context.iconName] || Tag;
                return (
                  <div key={context.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Badge className={`${context.colorClass} flex-shrink-0`}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        <span className="truncate">{context.label}</span>
                      </Badge>
                      {context.isDefault && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">(Default)</span>
                      )}
                    </div>
                    {!context.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(context.id, context.isDefault)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {contexts.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">No contexts defined.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}