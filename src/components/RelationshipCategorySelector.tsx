import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRelationshipCategoryPreferences, CATEGORY_CONFIGS } from '@/hooks/useRelationshipCategoryPreferences';

interface RelationshipCategorySelectorProps {
  mode?: 'onboarding' | 'settings';
  onComplete?: (selectedCategories: string[]) => void;
  className?: string;
}

export function RelationshipCategorySelector({
  mode = 'settings',
  onComplete,
  className
}: RelationshipCategorySelectorProps) {
  const { 
    availableCategories, 
    enabledCategories,
    enableCategories, 
    isUpdating 
  } = useRelationshipCategoryPreferences();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (mode === 'onboarding') {
      return CATEGORY_CONFIGS.filter(config => config.defaultEnabled).map(config => config.name);
    }
    return [];
  });

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleComplete = () => {
    if (mode === 'onboarding') {
      onComplete?.(selectedCategories);
    } else {
      // Settings mode - enable selected categories
      const categoriesToEnable = selectedCategories.filter(name => 
        !enabledCategories.some(enabled => enabled.category_name === name)
      );
      
      if (categoriesToEnable.length > 0) {
        enableCategories(categoriesToEnable);
      }
      setSelectedCategories([]);
    }
  };

  const categoriestoShow = mode === 'onboarding' ? CATEGORY_CONFIGS : availableCategories.map(config => config);
  const hasSelection = selectedCategories.length > 0;

  if (mode === 'settings' && availableCategories.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            All available relationship categories are already enabled.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'onboarding' ? 'Choose Your Relationship Categories' : 'Enable New Categories'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {mode === 'onboarding' 
            ? 'Select the types of relationships you want to track. You can always add more later in your settings.'
            : 'Select additional relationship categories to add to your PinkWizard.'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categoriestoShow.map((config) => {
          const IconComponent = (LucideIcons as any)[config.icon] || LucideIcons.User;
          const isSelected = selectedCategories.includes(config.name);
          const isAlreadyEnabled = mode === 'settings' && 
            enabledCategories.some(enabled => enabled.category_name === config.name);

          return (
            <div
              key={config.name}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isSelected && "bg-primary/5 border-primary",
                isAlreadyEnabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isAlreadyEnabled && handleCategoryToggle(config.name)}
            >
              <Checkbox
                checked={isSelected || isAlreadyEnabled}
                disabled={isAlreadyEnabled}
                className="mt-0.5"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{config.label}</h4>
                  {isAlreadyEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      Enabled
                    </Badge>
                  )}
                  {mode === 'onboarding' && config.defaultEnabled && (
                    <Badge variant="outline" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>

              {isSelected && !isAlreadyEnabled && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          );
        })}

        {hasSelection && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleComplete}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                'Processing...'
              ) : mode === 'onboarding' ? (
                <>
                  Continue with {selectedCategories.length} Categories
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                `Enable ${selectedCategories.length} Categories`
              )}
            </Button>
          </div>
        )}

        {mode === 'onboarding' && !hasSelection && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Select at least one category to continue
          </div>
        )}
      </CardContent>
    </Card>
  );
}