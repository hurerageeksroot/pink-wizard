import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface BackfillResult {
  success: boolean;
  total_revenue_metrics: number;
  missing_activities_found: number;
  activities_created: number;
  skipped: number;
  errors: number;
  details?: {
    created: Array<{ activity_id: string; metric_id: string; contact_id: string; revenue: number }>;
    skipped: Array<{ metric_id: string; reason: string }>;
    errors: Array<{ metric_id: string; contact_id: string; error: string }>;
  };
}

export function BackfillRevenueActivities() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const { toast } = useToast();

  const runBackfill = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('[BackfillRevenueActivities] Starting backfill...');

      const { data, error } = await supabase.functions.invoke('backfill-revenue-activities', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[BackfillRevenueActivities] Error:', error);
        throw error;
      }

      console.log('[BackfillRevenueActivities] Result:', data);
      setResult(data as BackfillResult);

      if (data.success && data.activities_created > 0) {
        toast({
          title: 'Backfill Complete',
          description: `Successfully created ${data.activities_created} missing revenue activities.`,
        });
      } else if (data.success && data.activities_created === 0) {
        toast({
          title: 'No Missing Activities',
          description: 'All revenue entries already have corresponding activities.',
        });
      }

    } catch (error: any) {
      console.error('[BackfillRevenueActivities] Fatal error:', error);
      toast({
        title: 'Backfill Failed',
        description: error.message || 'An error occurred during backfill',
        variant: 'destructive',
      });
      setResult({
        success: false,
        total_revenue_metrics: 0,
        missing_activities_found: 0,
        activities_created: 0,
        skipped: 0,
        errors: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill Revenue Activities</CardTitle>
        <CardDescription>
          Fix historical revenue entries that are missing from the Activities timeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool scans your user_metrics table for revenue entries and creates missing activity records.
            It's safe to run multiple times - it will skip entries that already have activities.
          </AlertDescription>
        </Alert>

        <Button
          onClick={runBackfill}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Backfill...
            </>
          ) : (
            'Run Backfill'
          )}
        </Button>

        {result && (
          <div className="space-y-3 mt-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Backfill completed successfully
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Backfill failed - please check the console for details
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-semibold">Total Revenue Entries</div>
                <div className="text-2xl">{result.total_revenue_metrics}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-semibold">Missing Activities Found</div>
                <div className="text-2xl">{result.missing_activities_found}</div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950/20 rounded-lg">
                <div className="font-semibold text-green-800 dark:text-green-200">Activities Created</div>
                <div className="text-2xl text-green-600">{result.activities_created}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-semibold">Skipped</div>
                <div className="text-2xl">{result.skipped}</div>
              </div>
            </div>

            {result.errors > 0 && result.details?.errors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">{result.errors} errors occurred:</div>
                  <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                    {result.details.errors.map((err, idx) => (
                      <div key={idx} className="font-mono">
                        Contact: {err.contact_id.substring(0, 8)}... - {err.error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.activities_created > 0 && result.details?.created && (
              <div className="p-3 bg-muted rounded-lg text-xs">
                <div className="font-semibold mb-2">Created Activities:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.details.created.map((activity, idx) => (
                    <div key={idx} className="font-mono">
                      ${activity.revenue.toLocaleString()} - Contact: {activity.contact_id.substring(0, 8)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
