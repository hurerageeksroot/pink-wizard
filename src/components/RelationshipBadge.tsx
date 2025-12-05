import { Badge } from "@/components/ui/badge";
import { RelationshipType } from "@/types/crm";
import { ChevronDown, Info, HelpCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";

interface RelationshipBadgeProps {
  type: RelationshipType;
  className?: string;
  onChange?: (type: RelationshipType) => void;
  disabled?: boolean;
}

export function RelationshipBadge({ type, className, onChange, disabled = false }: RelationshipBadgeProps) {
  const { relationshipTypes, getRelationshipTypeByName } = useRelationshipTypes();
  const relationshipType = getRelationshipTypeByName(type);

  // Fallback for unknown relationship types
  if (!relationshipType) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
        <HelpCircle className="w-3 h-3 mr-1" />
        {type || 'Unknown'}
      </Badge>
    );
  }

  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[relationshipType.iconName] || LucideIcons.HelpCircle;
  
  // If no onChange provided, render as static badge
  if (!onChange || disabled) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(relationshipType.colorClass, className)}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {relationshipType.label}
      </Badge>
    );
  }
  
  // Render interactive dropdown badge
  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border shadow-soft hover:opacity-80 transition-opacity cursor-pointer",
                  relationshipType.colorClass,
                  className
                )}
                onClick={(e) => e.stopPropagation()} // Prevent card click
              >
                <IconComponent className="w-3 h-3" />
                {relationshipType.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[60] max-w-[250px]">
            <p className="text-sm">
              {relationshipType.isLeadType ? 'Lead relationship type' : 'Nurture relationship type'}
            </p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border shadow-lg z-50"
          onClick={(e) => e.stopPropagation()} // Prevent card click
        >
          {relationshipTypes.map((relType) => {
            const RelationshipIcon = (LucideIcons as any)[relType.iconName] || LucideIcons.HelpCircle;
            return (
              <Tooltip key={relType.id}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(relType.name as RelationshipType);
                    }}
                    className={cn(
                      "cursor-pointer",
                      type === relType.name && "bg-accent"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mr-2 flex-shrink-0",
                          relType.colorClass
                        )}
                      >
                        <RelationshipIcon className="w-3 h-3 mr-1" />
                        {relType.label}
                      </span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-[70] max-w-[250px]">
                  <p className="text-sm">
                    {relType.isLeadType ? 'Lead relationship type' : 'Nurture relationship type'}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}