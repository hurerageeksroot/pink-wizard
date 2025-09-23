import { Badge } from "@/components/ui/badge";
import { RelationshipType } from "@/types/crm";
import { Users, Heart, Handshake, Share2, UserCheck, Target, ChevronDown, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RelationshipBadgeProps {
  type: RelationshipType;
  className?: string;
  onChange?: (type: RelationshipType) => void;
  disabled?: boolean;
}

const relationshipConfig = {
  lead: {
    label: 'Lead - Client',
    variant: 'secondary' as const,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    icon: Target,
    tooltip: 'Potential customer for your services'
  },
  lead_amplifier: {
    label: 'Lead - Amplifier',
    variant: 'secondary' as const,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    icon: Target,
    tooltip: 'Could refer business to you or partner with you'
  },
  past_client: {
    label: 'Past Client',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    icon: UserCheck,
    tooltip: 'Someone who has hired you before'
  },
  friend_family: {
    label: 'Friend/Family',
    variant: 'secondary' as const,
    className: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    icon: Heart,
    tooltip: 'Personal connections in your network'
  },
  associate_partner: {
    label: 'Colleague/Associate',
    variant: 'secondary' as const,
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    icon: Handshake,
    tooltip: 'Colleague or professional associate'
  },
  referral_source: {
    label: 'Referral Source',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    icon: Share2,
    tooltip: 'Someone who regularly sends you business'
  },
  booked_client: {
    label: 'Current Client',
    variant: 'secondary' as const,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    icon: UserCheck,
    tooltip: 'Someone who is currently working with you'
  }
};

export function RelationshipBadge({ type, className, onChange, disabled = false }: RelationshipBadgeProps) {
  const config = relationshipConfig[type];
  const Icon = config.icon;
  
  // If no onChange provided, render as static badge
  if (!onChange || disabled) {
    return (
      <Badge 
        variant={config.variant} 
        className={cn(config.className, className)}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
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
                  config.className,
                  className
                )}
                onClick={(e) => e.stopPropagation()} // Prevent card click
              >
                <Icon className="w-3 h-3" />
                {config.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[60] max-w-[250px]">
            <p className="text-sm">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background border shadow-lg z-50"
          onClick={(e) => e.stopPropagation()} // Prevent card click
        >
          {Object.entries(relationshipConfig).map(([relationshipKey, relationshipData]) => {
            const RelationshipIcon = relationshipData.icon;
            return (
              <Tooltip key={relationshipKey}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(relationshipKey as RelationshipType);
                    }}
                    className={cn(
                      "cursor-pointer",
                      type === relationshipKey && "bg-accent"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mr-2 flex-shrink-0",
                          relationshipData.className
                        )}
                      >
                        <RelationshipIcon className="w-3 h-3 mr-1" />
                        {relationshipData.label}
                      </span>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="z-[70] max-w-[250px]">
                  <p className="text-sm">{relationshipData.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}