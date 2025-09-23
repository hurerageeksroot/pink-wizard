import { useState } from 'react';
import { useContactCategories } from '@/hooks/useContactCategories';
import { ContactCategoryCreate } from '@/types/contactCategory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Palette } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const AVAILABLE_ICONS = [
  'Building2', 'Heart', 'ChefHat', 'Music', 'Camera', 'Users', 'MapPin', 'Home', 
  'Sparkles', 'HelpCircle', 'Briefcase', 'Car', 'Plane', 'Coffee', 'Gamepad2',
  'ShoppingCart', 'Stethoscope', 'GraduationCap', 'Palette', 'Wrench'
];

const COLOR_PRESETS = [
  { name: 'Gray', class: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
  { name: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { name: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' },
  { name: 'Orange', class: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { name: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { name: 'Green', class: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { name: 'Slate', class: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  { name: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { name: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { name: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
];

export function CategoryManager() {
  const { categories, loading, addCategory, deleteCategory, getContactCountForCategory } = useContactCategories();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<ContactCategoryCreate>({
    name: '',
    label: '',
    iconName: 'HelpCircle',
    colorClass: COLOR_PRESETS[0].class,
  });
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim() || !newCategory.label.trim()) return;

    const success = await addCategory(newCategory);
    if (success) {
      setNewCategory({
        name: '',
        label: '',
        iconName: 'HelpCircle',
        colorClass: COLOR_PRESETS[0].class,
      });
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // Get contact count for warning
    const count = await getContactCountForCategory(categoryName);
    setContactCounts(prev => ({ ...prev, [categoryName]: count }));
    
    const success = await deleteCategory(categoryId);
    if (success) {
      // Remove from contact counts
      setContactCounts(prev => {
        const updated = { ...prev };
        delete updated[categoryName];
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Contact Categories
        </CardTitle>
        <CardDescription>
          Manage your contact categories. Delete unused categories to keep your system organized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Categories */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Categories</Label>
          <div className="grid gap-2">
            {categories.map((category) => {
              const IconComponent = (LucideIcons as any)[category.iconName] || LucideIcons.HelpCircle;
              const count = contactCounts[category.name];
              
              return (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={category.colorClass}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {category.label}
                    </Badge>
                    {category.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {category.name !== 'uncategorized' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => getContactCountForCategory(category.name).then(count => 
                              setContactCounts(prev => ({ ...prev, [category.name]: count }))
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the "{category.label}" category?
                              {count !== undefined && count > 0 && (
                                <span className="block mt-2 font-medium text-amber-600">
                                  This will move {count} contact{count === 1 ? '' : 's'} to "Uncategorized".
                                </span>
                              )}
                              {count === 0 && (
                                <span className="block mt-2 text-green-600">
                                  No contacts are using this category.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Category
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Category */}
        <div className="border-t pt-4">
          {!isAddingCategory ? (
            <Button
              onClick={() => setIsAddingCategory(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Category
            </Button>
          ) : (
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., consultant"
                    className="lowercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryLabel">Display Label</Label>
                  <Input
                    id="categoryLabel"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Consultant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={newCategory.iconName}
                    onValueChange={(value) => setNewCategory(prev => ({ ...prev, iconName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map((iconName) => {
                        const IconComponent = (LucideIcons as any)[iconName];
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={newCategory.colorClass}
                    onValueChange={(value) => setNewCategory(prev => ({ ...prev, colorClass: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((preset) => (
                        <SelectItem key={preset.name} value={preset.class}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border ${preset.class}`} />
                            {preset.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div>
                  <Badge variant="outline" className={newCategory.colorClass || COLOR_PRESETS[0].class}>
                    {(() => {
                      const IconComponent = (LucideIcons as any)[newCategory.iconName || 'HelpCircle'];
                      return <IconComponent className="w-3 h-3 mr-1" />;
                    })()}
                    {newCategory.label || 'Category Label'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!newCategory.name.trim() || !newCategory.label.trim()}>
                  Add Category
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategory({
                      name: '',
                      label: '',
                      iconName: 'HelpCircle',
                      colorClass: COLOR_PRESETS[0].class,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}