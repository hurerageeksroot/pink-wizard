import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';

interface ProspectSearchButtonProps {
  canSearch: boolean;
  isSearching: boolean;
  onSearch: () => void;
}

export function ProspectSearchButton({ canSearch, isSearching, onSearch }: ProspectSearchButtonProps) {
  return (
    <div className="space-y-4">
      <Button
        onClick={onSearch}
        disabled={!canSearch || isSearching}
        size="lg"
        className="w-full"
      >
        {isSearching ? (
          <>
            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
            Finding Prospects...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Find Today's Prospects
          </>
        )}
      </Button>

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          {canSearch ? (
            <>1 search per day • Uses ~3,500 AI tokens</>
          ) : (
            <>You've used today's search • Come back tomorrow!</>
          )}
        </p>
      </div>
    </div>
  );
}