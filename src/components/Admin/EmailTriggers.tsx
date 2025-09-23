import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, Settings, Users, Calendar, Send, TestTube, AlertCircle, CheckCircle, Zap, Play, Pause } from "lucide-react";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description: string;
}

interface EmailSequence {
  id: string;
  name: string;
  trigger_event: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_key: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string;
  sent_at: string;
  created_at: string;
  metadata: any;
}

export function EmailTriggers() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    setLoading(true);
    try {
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Load sequences
      const { data: sequencesData, error: sequencesError } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (sequencesError) throw sequencesError;

      // Load recent email logs
      const { data: logsData, error: logsError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setTemplates(templatesData || []);
      setSequences(sequencesData || []);
      setLogs(logsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load email data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: isActive ? "Template Enabled" : "Template Disabled",
        description: `Template has been ${isActive ? 'enabled' : 'disabled'}`,
      });

      loadEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update template: " + error.message,
        variant: "destructive"
      });
    }
  };

  const toggleSequence = async (sequenceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .update({ is_active: isActive })
        .eq('id', sequenceId);

      if (error) throw error;

      toast({
        title: isActive ? "Sequence Enabled" : "Sequence Disabled",
        description: `Email sequence has been ${isActive ? 'enabled' : 'disabled'}`,
      });

      loadEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update sequence: " + error.message,
        variant: "destructive"
      });
    }
  };

  const sendTestEmail = async (templateKey: string) => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for testing",
        variant: "destructive"
      });
      return;
    }

    setSendingTest(templateKey);
    try {
      // Find the template to get variables
      const template = templates.find(t => t.template_key === templateKey);
      if (!template) {
        throw new Error("Template not found");
      }

      // Create test variables
      const testVariables: Record<string, string> = {};
      Object.keys(template.variables || {}).forEach(key => {
        testVariables[key] = `Test ${key}`;
      });

      // Override common variables with more realistic test data
      testVariables.user_name = 'Test User';
      testVariables.app_name = 'PinkWizard';
      testVariables.dashboard_url = window.location.origin;

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          templateKey,
          recipientEmail: testEmail,
          variables: testVariables,
          idempotencyKey: `test_${templateKey}_${Date.now()}`
        }
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || data.technical_error || 'Failed to send email');
      }

      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${testEmail}`,
      });

      // Refresh logs to show the new email
      setTimeout(loadEmailData, 1000);
    } catch (error: any) {
      console.error('Test email error:', error);
      
      let errorMessage = error.message || 'Failed to send test email';
      
      // Show helpful error message for domain verification issues
      if (errorMessage.includes('verify') || errorMessage.includes('domain')) {
        toast({
          title: "Domain Verification Required",
          description: errorMessage + " Visit resend.com/domains to verify your domain, or test with your verified Resend email address only.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setSendingTest(null);
    }
  };

  const processEmailSequences = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-email-sequences');
      
      if (error) throw error;

      toast({
        title: "Email Sequences Processed",
        description: `Processed ${data.processedCount || 0} scheduled emails`,
      });

      // Refresh logs
      loadEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process email sequences: " + error.message,
        variant: "destructive"
      });
    }
  };

  const broadcastChallengeEmail = async (templateKey: string) => {
    try {
      const { data, error } = await supabase.rpc('broadcast_challenge_email', {
        template_key_param: templateKey
      });
      
      if (error) throw error;

      toast({
        title: "Broadcast Queued",
        description: `${(data as any)?.emails_queued || 'Multiple'} emails queued for active challenge participants`,
      });

      // Refresh logs to show queued emails
      setTimeout(loadEmailData, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to queue broadcast: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getLastRun = (templateKey: string) => {
    const log = logs.find(l => l.template_key === templateKey);
    return log ? format(new Date(log.created_at), 'PPp') : 'Never';
  };

  const getEmailCount = (templateKey: string) => {
    return logs.filter(l => l.template_key === templateKey).length;
  };

  const getSentCount = () => {
    return logs.filter(l => l.status === 'sent').length;
  };

  const getPendingCount = () => {
    return logs.filter(l => l.status === 'pending').length;
  };

  const getFailedCount = () => {
    return logs.filter(l => l.status === 'failed').length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {templates.length} total templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSentCount()}</div>
            <p className="text-xs text-muted-foreground">
              successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPendingCount()}</div>
            <p className="text-xs text-muted-foreground">
              awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFailedCount()}</div>
            <p className="text-xs text-muted-foreground">
              delivery failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Email</CardTitle>
            <TestTube className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Controls
          </CardTitle>
          <CardDescription>
            Manage email system operations and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={processEmailSequences}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Process Email Sequences
            </Button>
            <Button
              onClick={() => broadcastChallengeEmail('introduce_contact_categories_v1')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Queue Broadcast: Contact Categories
            </Button>
            <Button
              onClick={() => broadcastChallengeEmail('introduce_warm_outreach_v1')}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Queue Broadcast: Warm Outreach
            </Button>
            <Button
              onClick={loadEmailData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Manage email templates and their active status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description || 'No description'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {template.template_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                      />
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getLastRun(template.template_key)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getEmailCount(template.template_key)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendTestEmail(template.template_key)}
                      disabled={!testEmail || sendingTest === template.template_key}
                      className="flex items-center gap-1"
                    >
                      <TestTube className="h-3 w-3" />
                      {sendingTest === template.template_key ? 'Sending...' : 'Test'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Sequences */}
      {sequences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Email Sequences
            </CardTitle>
            <CardDescription>
              Automated email sequences triggered by events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Trigger Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((sequence) => (
                  <TableRow key={sequence.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sequence.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {sequence.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {sequence.trigger_event}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={sequence.is_active}
                          onCheckedChange={(checked) => toggleSequence(sequence.id, checked)}
                        />
                        <Badge variant={sequence.is_active ? "default" : "secondary"}>
                          {sequence.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3 w-3" />
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Email Activity
          </CardTitle>
          <CardDescription>
            Recent email deliveries and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 10).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {log.template_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.recipient_email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.subject}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.sent_at ? format(new Date(log.sent_at), 'PPp') : 
                       format(new Date(log.created_at), 'PPp')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}