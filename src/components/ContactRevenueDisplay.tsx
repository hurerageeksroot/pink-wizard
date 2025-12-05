import { useContactRevenue } from "@/hooks/useContactRevenue";
import { DollarSign } from "lucide-react";

interface ContactRevenueDisplayProps {
  contactId: string;
  className?: string;
}

export function ContactRevenueDisplay({ contactId, className = "" }: ContactRevenueDisplayProps) {
  const { data: revenueEntries = [], isLoading } = useContactRevenue(contactId);
  
  const totalRevenue = revenueEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Don't show anything while loading or if no revenue
  if (isLoading || totalRevenue === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <span className="text-muted-foreground flex items-center gap-1">
        <DollarSign className="w-3 h-3" />
        Revenue:
      </span>
      <span className="font-semibold text-green-600 dark:text-green-400">
        ${totalRevenue.toLocaleString()}
      </span>
    </div>
  );
}
