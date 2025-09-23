import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Award, TrendingUp } from 'lucide-react';

export function PointsToast() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('points-toast-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'user_points_ledger',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEntry = payload.new as any;
          
          toast.success(
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">
                  +{newEntry.points_earned} points earned!
                </div>
                <div className="text-sm text-muted-foreground">
                  {newEntry.description || newEntry.activity_type}
                </div>
              </div>
            </div>,
            {
              duration: 4000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}