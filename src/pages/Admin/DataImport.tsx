import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileJson, CheckCircle, XCircle, Loader2, Wrench, AlertTriangle, Search } from 'lucide-react';
import { useEnhancedRelationshipTypes } from '@/hooks/useEnhancedRelationshipTypes';

interface BackupData {
  exportedAt: string;
  sinceTimestamp: string;
  summary: {
    activities: number;
    newContacts: number;
    updatedContacts: number;
    dailyTasks: number;
    weeklyTasks: number;
    points: number;
    contactResearch: number;
    contactContextAssignments: number;
  };
  data: {
    activities: any[];
    newContacts: any[];
    updatedContacts: any[];
    dailyTasks: any[];
    weeklyTasks: any[];
    points: any[];
    contactResearch: any[];
    contactContextAssignments: any[];
  };
}

interface ImportResult {
  table: string;
  success: number;
  failed: number;
  errors?: string[];
}

export default function DataImport() {
  const { relationshipTypes, getDefaultStatusForType } = useEnhancedRelationshipTypes();
  const [file, setFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidContacts, setInvalidContacts] = useState<any[] | null>(null);
  const [checkingInvalid, setCheckingInvalid] = useState(false);
  const [migratingInvalid, setMigratingInvalid] = useState(false);
  const [intentMismatches, setIntentMismatches] = useState<any[] | null>(null);
  const [checkingIntents, setCheckingIntents] = useState(false);
  const [fixingIntents, setFixingIntents] = useState(false);

  const normalizeBackupData = (json: any): BackupData => {
    // If it's already in the new format, return as-is
    if (json.data && json.exportedAt) {
      return json;
    }
    
    // Convert old format to new format
    return {
      exportedAt: json.export_timestamp || new Date().toISOString(),
      sinceTimestamp: json.data_since || null,
      summary: {
        activities: json.summary?.activities_count || 0,
        newContacts: json.summary?.new_contacts_count || 0,
        updatedContacts: json.summary?.updated_contacts_count || 0,
        dailyTasks: json.summary?.daily_tasks_count || 0,
        weeklyTasks: json.summary?.weekly_tasks_count || 0,
        points: json.summary?.points_count || 0,
        contactResearch: json.summary?.contact_research_count || 0,
        contactContextAssignments: json.summary?.context_assignments_count || 0
      },
      data: {
        activities: json.activities || [],
        newContacts: json.contacts?.new || [],
        updatedContacts: json.contacts?.updated || [],
        dailyTasks: json.tasks?.daily || [],
        weeklyTasks: json.tasks?.weekly || [],
        points: json.points || [],
        contactResearch: json.contact_research || [],
        contactContextAssignments: json.context_assignments || []
      }
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a JSON file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResults(null);

    // Parse and validate the JSON file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Normalize to expected format (supports both old and new formats)
        const normalized = normalizeBackupData(json);

        setBackupData(normalized);
      } catch (err) {
        setError('Invalid JSON file');
        setBackupData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!backupData) return;

    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error: functionError } = await supabase.functions.invoke('import-backup-data', {
        body: { backupData: backupData.data },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Import failed');
      }

      setResults(data.results);
      
      const totalSuccess = data.results.reduce((sum: number, r: ImportResult) => sum + r.success, 0);
      const totalFailed = data.results.reduce((sum: number, r: ImportResult) => sum + r.failed, 0);

      if (totalFailed === 0) {
        toast.success(`Successfully imported ${totalSuccess} records!`);
      } else {
        toast.warning(`Imported ${totalSuccess} records with ${totalFailed} errors`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed');
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const checkInvalidRelationshipTypes = async () => {
    setCheckingInvalid(true);
    setError(null);

    try {
      if (!relationshipTypes || relationshipTypes.length === 0) {
        throw new Error('No relationship types configured');
      }

      const validTypeNames = relationshipTypes.map(rt => rt.name);
      
      // Query contacts with invalid relationship types
      const { data: contacts, error: queryError } = await supabase
        .from('contacts')
        .select('id, name, email, relationship_type, relationship_status, relationship_intent')
        .not('relationship_type', 'in', `(${validTypeNames.join(',')})`)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setInvalidContacts(contacts || []);
      
      if (contacts && contacts.length > 0) {
        toast.warning(`Found ${contacts.length} contacts with invalid relationship types`);
      } else {
        toast.success('All contacts have valid relationship types!');
      }
    } catch (err: any) {
      console.error('Check invalid types error:', err);
      setError(err.message || 'Check failed');
      toast.error('Failed to check contacts');
    } finally {
      setCheckingInvalid(false);
    }
  };

  const migrateInvalidRelationshipTypes = async () => {
    if (!invalidContacts || invalidContacts.length === 0) return;

    setMigratingInvalid(true);
    setError(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const contact of invalidContacts) {
        // Find suitable replacement type
        let newType = relationshipTypes?.find(rt => 
          rt.relationshipIntent === contact.relationship_intent
        ) || relationshipTypes?.[0];

        if (newType) {
          const newStatus = getDefaultStatusForType(newType.name);

          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              relationship_type: newType.name,
              relationship_status: newStatus,
              relationship_intent: newType.relationshipIntent
            })
            .eq('id', contact.id);

          if (updateError) {
            console.error('Failed to migrate contact:', contact.id, updateError);
            failCount++;
          } else {
            successCount++;
          }
        }
      }

      toast.success(`Migrated ${successCount} contacts successfully!`);
      if (failCount > 0) {
        toast.warning(`${failCount} contacts failed to migrate`);
      }

      // Clear invalid contacts list
      setInvalidContacts(null);
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Migration failed');
      toast.error('Failed to migrate contacts');
    } finally {
      setMigratingInvalid(false);
    }
  };

  const checkIntentMismatches = async () => {
    setCheckingIntents(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call edge function to check for mismatches
      const { data, error: functionError } = await supabase.functions.invoke('fix-relationship-intent-mismatches', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Check failed');
      }

      // Extract mismatches from the response (contacts that need fixing)
      const mismatches = data.fixes || [];
      
      // Also get current mismatches by querying directly
      if (!relationshipTypes || relationshipTypes.length === 0) {
        throw new Error('No relationship types configured');
      }

      const typeToIntentMap = new Map(
        relationshipTypes.map(rt => [rt.name, rt.relationshipIntent])
      );

      const { data: contacts, error: queryError } = await supabase
        .from('contacts')
        .select('id, name, email, relationship_type, relationship_status, relationship_intent')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const currentMismatches = (contacts || []).filter(c => {
        const correctIntent = typeToIntentMap.get(c.relationship_type);
        return correctIntent && c.relationship_intent !== correctIntent;
      });

      setIntentMismatches(currentMismatches);
      
      if (currentMismatches.length > 0) {
        toast.warning(`Found ${currentMismatches.length} contacts with intent mismatches`);
      } else {
        toast.success('All contacts have correct relationship intents!');
      }
    } catch (err: any) {
      console.error('Check intent mismatches error:', err);
      setError(err.message || 'Check failed');
      toast.error('Failed to check intent mismatches');
    } finally {
      setCheckingIntents(false);
    }
  };

  const fixIntentMismatches = async () => {
    setFixingIntents(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error: functionError } = await supabase.functions.invoke('fix-relationship-intent-mismatches', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Fix failed');
      }

      const fixedCount = data.fixedCount || 0;
      const errors = data.errors || [];

      if (fixedCount > 0) {
        toast.success(`Fixed ${fixedCount} contacts successfully!`);
      } else {
        toast.info('No mismatches found to fix');
      }

      if (errors.length > 0) {
        toast.warning(`${errors.length} contacts failed to fix`);
        console.error('Fix errors:', errors);
      }

      // Clear mismatches list
      setIntentMismatches(null);
    } catch (err: any) {
      console.error('Fix intent mismatches error:', err);
      setError(err.message || 'Fix failed');
      toast.error('Failed to fix intent mismatches');
    } finally {
      setFixingIntents(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Import & Migration</h1>
        <p className="text-muted-foreground mt-2">
          Upload backup files or fix invalid relationship types from CSV imports
        </p>
      </div>

      {/* Relationship Intent Mismatch Tool */}
      <Card className="p-6 border-red-500/50">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Fix Relationship Intent Mismatches</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contacts may have incorrect relationship_intent that doesn't match their relationship_type. 
                This causes the Edit Contact dialog to show different statuses than the Contact Card.
              </p>
            </div>
          </div>

          {intentMismatches !== null && (
            <Alert className={intentMismatches.length > 0 ? "border-red-500/50 bg-red-500/10" : "border-green-500/50 bg-green-500/10"}>
              {intentMismatches.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Found {intentMismatches.length} contacts with intent mismatches:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {intentMismatches.slice(0, 10).map((c) => (
                          <div key={c.id} className="text-xs">
                            • {c.name} ({c.email}) - Type: "{c.relationship_type}" has intent: "{c.relationship_intent}"
                          </div>
                        ))}
                        {intentMismatches.length > 10 && (
                          <p className="text-xs italic">...and {intentMismatches.length - 10} more</p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>All contacts have correct relationship intents!</AlertDescription>
                </>
              )}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={checkIntentMismatches}
              disabled={checkingIntents}
              variant="outline"
            >
              {checkingIntents ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Check for Intent Mismatches
                </>
              )}
            </Button>

            {intentMismatches && intentMismatches.length > 0 && (
              <Button
                onClick={fixIntentMismatches}
                disabled={fixingIntents}
                className="bg-red-500 hover:bg-red-600"
              >
                {fixingIntents ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Fix {intentMismatches.length} Mismatches
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bulk Relationship Type Migration Tool */}
      <Card className="p-6 border-orange-500/50">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Fix Invalid Relationship Types</h3>
              <p className="text-sm text-muted-foreground mt-1">
                CSV imports may use relationship types that don't match your current settings. 
                This tool finds and migrates those contacts automatically.
              </p>
            </div>
          </div>

          {invalidContacts !== null && (
            <Alert className={invalidContacts.length > 0 ? "border-orange-500/50 bg-orange-500/10" : "border-green-500/50 bg-green-500/10"}>
              {invalidContacts.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Found {invalidContacts.length} contacts with invalid types:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {invalidContacts.slice(0, 10).map((c) => (
                          <div key={c.id} className="text-xs">
                            • {c.name} ({c.email}) - Type: "{c.relationship_type}"
                          </div>
                        ))}
                        {invalidContacts.length > 10 && (
                          <p className="text-xs italic">...and {invalidContacts.length - 10} more</p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>All contacts have valid relationship types!</AlertDescription>
                </>
              )}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={checkInvalidRelationshipTypes}
              disabled={checkingInvalid}
              variant="outline"
            >
              {checkingInvalid ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Check for Invalid Types
                </>
              )}
            </Button>

            {invalidContacts && invalidContacts.length > 0 && (
              <Button
                onClick={migrateInvalidRelationshipTypes}
                disabled={migratingInvalid}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {migratingInvalid ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Migrate {invalidContacts.length} Contacts
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">JSON backup file</p>
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <FileJson className="w-4 h-4" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {backupData && !results && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Ready to Import</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Exported: {new Date(backupData.exportedAt).toLocaleString()}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold">{backupData.summary.activities}</div>
                    <div className="text-sm text-muted-foreground">Activities</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold">
                      {backupData.summary.newContacts + backupData.summary.updatedContacts}
                    </div>
                    <div className="text-sm text-muted-foreground">Contacts</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold">
                      {backupData.summary.dailyTasks + backupData.summary.weeklyTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Tasks</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/50">
                    <div className="text-2xl font-bold">{backupData.summary.points}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Import Results</h3>
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.table}
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      {result.failed === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="font-medium capitalize">{result.table}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-green-500">{result.success} success</span>
                      {result.failed > 0 && (
                        <span className="text-destructive ml-2">{result.failed} failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  setFile(null);
                  setBackupData(null);
                  setResults(null);
                }}
                variant="outline"
                className="w-full"
              >
                Import Another File
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
