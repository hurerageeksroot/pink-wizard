import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnhancedRelationshipTypes } from "@/hooks/useEnhancedRelationshipTypes";

interface EnhancedRelationshipStatusBadgeProps {
  relationshipType: string;
  relationshipStatus: string;
  className?: string;
  onChange?: (newStatus: string) => void;
  disabled?: boolean;
}

export function EnhancedRelationshipStatusBadge({ 
  relationshipType, 
  relationshipStatus, 
  className = "", 
  onChange, 
  disabled = false 
}: EnhancedRelationshipStatusBadgeProps) {
  const { getStatusOptionsForType, getRelationshipTypeByName, RELATIONSHIP_INTENT_CONFIGS, isLoading } = useEnhancedRelationshipTypes();
  
  if (isLoading) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-200 animate-pulse ${className}`}>
        Loading...
      </Badge>
    );
  }

  const statusOptions = getStatusOptionsForType(relationshipType);
  const currentStatusConfig = statusOptions[relationshipStatus];
  const relType = getRelationshipTypeByName(relationshipType);
  
  if (!currentStatusConfig) {
    // Show fallback with basic status options if editing is enabled
    if (onChange && !disabled) {
      const fallbackStatuses = {
        'cold': { label: 'Cold', colorClass: 'bg-blue-100 text-blue-800' },
        'warm': { label: 'Warm', colorClass: 'bg-yellow-100 text-yellow-800' },
        'hot': { label: 'Hot', colorClass: 'bg-red-100 text-red-800' },
      };
      
      const fallbackStatus = fallbackStatuses[relationshipStatus as keyof typeof fallbackStatuses];
      if (fallbackStatus) {
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-auto p-0 hover:bg-transparent ${className}`}
          >
            <Badge className={`${fallbackStatus.colorClass} cursor-pointer hover:opacity-80`}>
              {fallbackStatus.label}
            </Badge>
          </Button>
        );
      }
    }
    
    return (
      <Badge className={`bg-gray-100 text-gray-800 border-gray-200 ${className}`}>
        {relationshipStatus || 'New'}
      </Badge>
    );
  }

  if (!onChange || disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${currentStatusConfig.colorClass} ${className}`}>
              {currentStatusConfig.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{currentStatusConfig.label}</div>
              <div className="text-muted-foreground">{currentStatusConfig.description}</div>
              {relType && (
                <div className="text-xs mt-1">
                  Context: {RELATIONSHIP_INTENT_CONFIGS[relType.relationshipIntent]?.label}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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
                <Badge className={`${currentStatusConfig.colorClass} cursor-pointer hover:opacity-80`}>
                  {currentStatusConfig.label}
                </Badge>
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mb-1">
              Status Options for {relType?.label}
            </div>
            {Object.entries(statusOptions).map(([statusKey, statusConfig]) => (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => onChange(statusKey)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Badge className={`${statusConfig.colorClass} pointer-events-none`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                {statusConfig.isTerminal && (
                  <span className="text-xs text-muted-foreground">Final</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">{currentStatusConfig.label}</div>
            <div className="text-muted-foreground">{currentStatusConfig.description}</div>
            {relType && (
              <div className="text-xs mt-1">
                Context: {RELATIONSHIP_INTENT_CONFIGS[relType.relationshipIntent]?.label}
              </div>
            )}
            <div className="text-xs mt-1">Click to change</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}