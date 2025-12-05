import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      toast.info('Starting data export...');

      const response = await supabase.functions.invoke('export-recent-data', {
        body: { since: '2025-10-22 11:58:30+00' }
      });

      if (response.error) {
        throw response.error;
      }

      // Create and download the file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pitr-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');

      // Show summary
      const summary = response.data.summary;
      toast.success(
        `Exported: ${summary.activities_count} activities, ${summary.new_contacts_count} new contacts, ${summary.updated_contacts_count} updated contacts, ${summary.daily_tasks_count} daily tasks, ${summary.weekly_tasks_count} weekly tasks, ${summary.points_count} points, ${summary.contact_research_count} research`
      );

    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export Tool</h1>
        <p className="text-muted-foreground mt-2">
          Export data created since 6:58:30 AM CT (11:58:30 UTC) on October 22, 2025
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This tool exports all activities, contacts, tasks, and points created or updated since 6:58:30 AM CT today.
          Use this before performing a Point-in-Time Recovery (PITR) restore to preserve recent user work.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            PITR Data Preservation Export
          </CardTitle>
          <CardDescription>
            Exports data from the last ~9 hours to preserve before database restore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">What will be exported:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>All activities created since 6:58:30 AM CT (29 records)</li>
              <li>New contacts created since 6:58:30 AM CT (11 records)</li>
              <li>Contact updates made since 6:58:30 AM CT (54 records)</li>
              <li>Daily tasks completed since 6:58:30 AM CT (25 records)</li>
              <li>Weekly tasks completed since 6:58:30 AM CT (6 records)</li>
              <li>All points entries since 6:58:30 AM CT (115 records)</li>
              <li>Contact research entries (8 records)</li>
              <li>Contact context assignments</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Important Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800 dark:text-amber-300">
              <li>Click the export button below to download the JSON file</li>
              <li>Save the file in a safe location on your computer</li>
              <li>Perform the PITR restore in Supabase dashboard</li>
              <li>After restore, use the Data Import tool to re-insert this data</li>
            </ol>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            size="lg"
            className="w-full"
          >
            <Download className="mr-2 h-5 w-5" />
            {isExporting ? 'Exporting...' : 'Export Data (Since 6:58:30 AM CT)'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            The export will download as a JSON file to your computer
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
