import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface BackfillResult {
  success: boolean;
  total_activities: number;
  processed: number;
  points_awarded: number;
  skipped: number;
  errors?: string[];
  error_count?: number;
  error?: string;
}

export function BackfillActivityPoints() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const { toast } = useToast();

  const runBackfill = async () => {
    try {
      setIsRunning(true);
      setResult(null);

      console.log('[BackfillActivityPoints] Starting backfill...');
      
      const { data, error } = await supabase.functions.invoke('backfill-activity-points', {
        method: 'POST'
      });

      if (error) {
        console.error('[BackfillActivityPoints] Error:', error);
        throw error;
      }

      console.log('[BackfillActivityPoints] Result:', data);
      setResult(data as BackfillResult);

      if (data.success) {
        toast({
          title: 'Backfill Complete',
          description: `Awarded ${data.points_awarded} points across ${data.processed} activities`,
        });
      } else {
        toast({
          title: 'Backfill Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[BackfillActivityPoints] Fatal error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to run backfill',
        variant: 'destructive'
      });
      setResult({
        success: false,
        error: error.message,
        total_activities: 0,
        processed: 0,
        points_awarded: 0,
        skipped: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backfill Activity Points
        </CardTitle>
        <CardDescription>
          Award missing points for all historical activities. This is safe to run multiple times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will process all activities that don't have points awarded yet. Activities from demo contacts are automatically skipped.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runBackfill} 
          disabled={isRunning}
          size="lg"
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Activities...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Run Backfill
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t">
            {result.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-semibold">Backfill Completed Successfully</div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>Total Activities: <span className="font-semibold">{result.total_activities}</span></div>
                      <div>Processed: <span className="font-semibold">{result.processed}</span></div>
                      <div>Points Awarded: <span className="font-semibold text-green-600">{result.points_awarded}</span></div>
                      <div>Skipped: <span className="font-semibold">{result.skipped}</span></div>
                    </div>
                    {result.error_count && result.error_count > 0 && (
                      <div className="text-amber-600 mt-2">
                        {result.error_count} errors occurred (non-critical)
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Backfill Failed</div>
                  <div className="text-sm mt-1">{result.error || 'Unknown error occurred'}</div>
                </AlertDescription>
              </Alert>
            )}

            {result.errors && result.errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold">
                  View Errors ({result.errors.length})
                </summary>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  {result.errors.map((error, i) => (
                    <li key={i} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
