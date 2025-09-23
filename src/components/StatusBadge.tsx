import { LeadStatus } from "@/types/crm";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, Info } from "lucide-react";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
  onChange?: (status: LeadStatus) => void;
  disabled?: boolean;
}

const statusConfig = {
  none: {
    label: 'N/A',
    className: 'bg-muted text-muted-foreground border-muted/20',
    tooltip: 'No specific lead status assigned'
  },
  cold: {
    label: 'Cold',
    className: 'bg-secondary text-secondary-foreground border-secondary/20 shadow-soft',
    tooltip: "Don't know you exist + aren't ready to spend money to hire or refer you"
  },
  warm: {
    label: 'Warm', 
    className: 'bg-accent text-accent-foreground border-accent/20 shadow-soft',
    tooltip: 'Know you exist but aren\'t currently ready to spend money to hire/refer you'
  },
  hot: {
    label: 'Hot',
    className: 'bg-primary text-primary-foreground border-primary/20 shadow-soft',
    tooltip: 'Know you exist and are ready to hire/refer you'
  },
  won: {
    label: 'Won',
    className: 'bg-won text-white border-won/20 shadow-soft',
    tooltip: 'Have hired you or referred business to you'
  },
  lost_maybe_later: {
    label: 'Lost - Maybe Later',
    className: 'bg-lost-maybe text-muted-foreground border-lost-maybe/20 shadow-soft',
    tooltip: 'Not ready now but might be in the future'
  },
  lost_not_fit: {
    label: 'Lost - Not a Fit',
    className: 'bg-destructive text-destructive-foreground border-destructive/20 shadow-soft',
    tooltip: 'Not a good match for your services'
  },
};

export function StatusBadge({ status, className, onChange, disabled = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // If no onChange provided, render as static badge
  if (!onChange || disabled) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border shadow-soft",
          config.className,
          className
        )}
      >
        {config.label}
      </span>
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
          className="w-44 bg-background border shadow-lg z-50"
          onClick={(e) => e.stopPropagation()} // Prevent card click
        >
          {Object.entries(statusConfig).map(([statusKey, statusData]) => (
            <Tooltip key={statusKey}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(statusKey as LeadStatus);
                  }}
                  className={cn(
                    "cursor-pointer",
                    status === statusKey && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mr-2 flex-shrink-0",
                        statusData.className
                      )}
                    >
                      {statusData.label}
                    </span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[70] max-w-[250px]">
                <p className="text-sm">{statusData.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}