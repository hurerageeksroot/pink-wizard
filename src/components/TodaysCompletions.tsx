import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const TodaysCompletions = () => {
  const { data: completions, isLoading } = useQuery({
    queryKey: ['todays-completions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_todays_full_completions');
      if (error) {
        console.error('Error fetching today\'s completions:', error);
        return 0;
      }
      return data || 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes during active use
  });

  if (isLoading) {
    return <Skeleton className="h-8 w-8" />;
  }

  return <span>{completions}</span>;
};

export default TodaysCompletions;