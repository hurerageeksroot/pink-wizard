import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact } from '@/types/crm';
import { isDemoContact } from '@/utils/demoContactUtils';

interface DemoContactIndicatorProps {
  contact: Contact;
  variant?: 'badge' | 'icon';
}

export function DemoContactIndicator({ contact, variant = 'badge' }: DemoContactIndicatorProps) {
  if (!isDemoContact(contact)) {
    return null;
  }

  const content = variant === 'badge' ? (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Demo
    </Badge>
  ) : (
    <AlertTriangle className="h-4 w-4 text-amber-600" />
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>Demo contact - No points/badges awarded</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}