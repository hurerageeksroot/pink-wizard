import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Plus, Settings, RefreshCw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRelationshipCategoryPreferences } from '@/hooks/useRelationshipCategoryPreferences';
import { RelationshipCategorySelector } from '@/components/RelationshipCategorySelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function RelationshipCategorySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    enabledCategories, 
    disabledCategories,
    availableCategories,
    updateCategory, 
    getCategoryConfig,
    isUpdating,
    categoryPreferences
  } = useRelationshipCategoryPreferences();
  
  const [showAddCategories, setShowAddCategories] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleCategory = (categoryName: string, isEnabled: boolean) => {
    updateCategory({ categoryName, isEnabled });
  };

  const handleSyncRelationshipTypes = async () => {
    if (!user?.id) return;
    
    setIsSyncing(true);
    try {
      const enabledCats = categoryPreferences.filter(p => p.is_enabled);
      let totalSeeded = 0;
      
      for (const cat of enabledCats) {
        const { data, error } = await supabase.rpc('seed_relationship_types_for_category', {
          p_user_id: user.id,
          p_category_name: cat.category_name
        });
        
        if (error) {
          console.error(`Failed to sync types for ${cat.category_name}:`, error);
        } else {
          totalSeeded += data || 0;
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['relationshipTypes'] });
      
      const message = totalSeeded > 0
        ? `Synced successfully! ${totalSeeded} relationship type${totalSeeded !== 1 ? 's' : ''} added.`
        : 'All relationship types are up to date.';
      
      toast.success(message);
    } catch (error) {
      console.error('Error syncing relationship types:', error);
      toast.error('Failed to sync relationship types');
    } finally {
      setIsSyncing(false);
    }
  };

  if (showAddCategories) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add New Categories</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowAddCategories(false)}
          >
            Back to Categories
          </Button>
        </div>
        
        <RelationshipCategorySelector 
          mode="settings"
          className="max-w-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Relationship Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage which relationship categories are active in your PinkWizard
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleSyncRelationshipTypes}
            disabled={isSyncing}
            className="flex items-center gap-2"
            title="Sync relationship types for enabled categories"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Types'}
          </Button>
          
          {(disabledCategories.length > 0 || availableCategories.length > 0) && (
            <Button 
              onClick={() => setShowAddCategories(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Discover New Categories
            </Button>
          )}
        </div>
      </div>

      {/* Active Categories Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Active Categories ({enabledCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {enabledCategories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No active categories found. Add some categories to get started.
            </div>
          ) : (
            enabledCategories.map((category) => {
              const config = getCategoryConfig(category.category_name);
              const IconComponent = config ? 
                (LucideIcons as any)[config.icon] || LucideIcons.User : 
                LucideIcons.User;

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background border-border"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-foreground" />
                    <div>
                      <h4 className="font-medium text-foreground">
                        {category.category_label}
                      </h4>
                      {config && (
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="default"
                      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                    >
                      Active
                    </Badge>
                    
                    {enabledCategories.length > 1 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCategory(category.category_name, false)}
                        disabled={isUpdating}
                        className="flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={true}
                        className="flex items-center gap-1 opacity-50"
                        title="At least one category must remain active"
                      >
                        <X className="h-3 w-3" />
                        Disable
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Disabled and Available Categories to Discover */}
      {(disabledCategories.length > 0 || availableCategories.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Discover New Categories ({disabledCategories.length + availableCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {disabledCategories.length > 0 
                ? "Categories you've disabled or haven't used yet:"
                : "Additional categories you haven't used yet:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {disabledCategories.map((category) => {
                const config = getCategoryConfig(category.category_name);
                return (
                  <Badge key={category.id} variant="outline" className="border-dashed">
                    {category.category_label}
                  </Badge>
                );
              })}
              {availableCategories
                .filter((config) => !disabledCategories.some(disabled => disabled.category_name === config.name))
                .map((config) => (
                  <Badge key={config.name} variant="outline" className="border-dashed">
                    {config.label}
                  </Badge>
                ))}
            </div>
            <Button 
              onClick={() => setShowAddCategories(true)}
              variant="outline"
              className="w-full mt-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Categories
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}