import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  email?: string;
  error?: string;
}

export function BusinessGoalsImport() {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste CSV data to import.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const lines = csvData.trim().split('\n');
      const importResults: ImportResult[] = [];

      // Skip header row (assuming first line is headers)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [email, leadsStr, eventsStr, revenueStr] = line.split(',').map(s => s.trim());
        
        if (!email || !leadsStr || !eventsStr || !revenueStr) {
          importResults.push({
            success: false,
            email: email || `Line ${i + 1}`,
            error: 'Missing required fields'
          });
          continue;
        }

        const leads = parseInt(leadsStr) || 0;
        const events = parseInt(eventsStr) || 0;
        const revenue = parseFloat(revenueStr) || 0;

        try {
          const { data, error } = await supabase.rpc('upsert_challenge_goals_by_email', {
            p_email: email,
            p_leads_goal: leads,
            p_events_goal: events,
            p_revenue_goal: revenue
          });

          if (error) throw error;

          const result = data as { success: boolean; error?: string };

          if (result?.success) {
            importResults.push({
              success: true,
              email: email
            });
          } else {
            importResults.push({
              success: false,
              email: email,
              error: result?.error || 'Unknown error'
            });
          }
        } catch (error) {
          importResults.push({
            success: false,
            email: email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setResults(importResults);
      
      const successCount = importResults.filter(r => r.success).length;
      const totalCount = importResults.length;
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} of ${totalCount} records.`,
        variant: successCount === totalCount ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to process CSV data. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setCsvData('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Import Challenge Goals
        </CardTitle>
        <CardDescription>
          Bulk import challenge goals from CSV data. Format: email, leads_goal, events_goal, revenue_goal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            CSV Format Example:
          </div>
          <div className="bg-muted p-3 rounded-md text-sm font-mono">
            email,leads_goal,events_goal,revenue_goal<br/>
            user@example.com,50,10,25000<br/>
            another@example.com,75,15,50000
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Paste your CSV data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleImport} 
            disabled={loading || !csvData.trim()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Importing...' : 'Import Goals'}
          </Button>
          {results.length > 0 && (
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Import Results:</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-2 rounded text-sm ${
                    result.success 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span>{result.email}</span>
                  <span>
                    {result.success ? '✓ Success' : `✗ ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Successfully imported: {results.filter(r => r.success).length} / {results.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}