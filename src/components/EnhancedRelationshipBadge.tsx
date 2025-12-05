import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnhancedRelationshipTypes } from "@/hooks/useEnhancedRelationshipTypes";
import { RelationshipIntent } from "@/types/crm";
import { getIconComponent } from "@/utils/iconMapping";

interface EnhancedRelationshipBadgeProps {
  relationshipType: string;
  className?: string;
  onChange?: (newType: string) => void;
  disabled?: boolean;
}

export function EnhancedRelationshipBadge({ 
  relationshipType, 
  className = "", 
  onChange, 
  disabled = false 
}: EnhancedRelationshipBadgeProps) {
  const { relationshipTypes, getRelationshipTypeByName, RELATIONSHIP_INTENT_CONFIGS, isLoading } = useEnhancedRelationshipTypes();
  
  if (isLoading) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-200 animate-pulse ${className}`}>
        Loading...
      </Badge>
    );
  }

  const currentType = getRelationshipTypeByName(relationshipType);
  
  if (!currentType) {
    // Show fallback with option to select if editing is enabled
    if (onChange && !disabled && relationshipTypes.length > 0) {
      const firstType = relationshipTypes[0];
      return (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onChange(firstType.name)}
          className={`h-auto p-1 text-xs ${className}`}
        >
          Select Type
        </Button>
      );
    }
    
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
        {relationshipType || 'Unknown'}
      </Badge>
    );
  }

  const IconComponent = getIconComponent(currentType.iconName);
  const intentConfig = RELATIONSHIP_INTENT_CONFIGS[currentType.relationshipIntent];

  if (!onChange || disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${currentType.colorClass} ${className}`}>
              <IconComponent className="w-3 h-3 mr-1" />
              {currentType.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{intentConfig?.label || 'Unknown Intent'}</div>
              <div className="text-muted-foreground">{intentConfig?.description || 'No description available'}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Group types by intent for better organization in dropdown
  const typesByIntent = Object.keys(RELATIONSHIP_INTENT_CONFIGS).reduce((acc, intent) => {
    acc[intent as RelationshipIntent] = relationshipTypes.filter(rt => rt.relationshipIntent === intent);
    return acc;
  }, {} as Record<RelationshipIntent, typeof relationshipTypes>);

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-auto p-0 hover:bg-transparent ${className}`}
              >
                <Badge className={`${currentType.colorClass} cursor-pointer hover:opacity-80`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {currentType.label}
                </Badge>
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {Object.entries(typesByIntent).map(([intent, types]) => {
              if (types.length === 0) return null;
              
              const intentConfig = RELATIONSHIP_INTENT_CONFIGS[intent as RelationshipIntent];
              const IntentIconComponent = getIconComponent(intentConfig?.iconName || 'Users');
              
              return (
                <div key={intent}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center">
                    <IntentIconComponent className="w-3 h-3 mr-2" />
                    {intentConfig?.label || 'Unknown Intent'}
                  </div>
                  {types.map((type) => {
                    const TypeIconComponent = getIconComponent(type.iconName);
                    return (
                      <DropdownMenuItem
                        key={type.id}
                        onClick={() => onChange(type.name)}
                        className="flex items-center space-x-2"
                      >
                        <Badge className={`${type.colorClass} pointer-events-none`}>
                          <TypeIconComponent className="w-3 h-3 mr-1" />
                          {type.label}
                        </Badge>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">{intentConfig?.label || 'Unknown Intent'}</div>
            <div className="text-muted-foreground">{intentConfig?.description || 'No description available'}</div>
            <div className="text-xs mt-1">Click to change</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}