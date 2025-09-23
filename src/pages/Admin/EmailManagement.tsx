import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandColorReference } from "@/components/BrandColorReference";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Eye, Mail, Plus, Send, Settings, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { ChallengeEmailBroadcast } from "@/components/Admin/ChallengeEmailBroadcast";
import { EmailTriggers } from "@/components/Admin/EmailTriggers";
import DOMPurify from 'dompurify';

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

const EmailManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailTemplates();
    fetchEmailLogs();
  }, []);

  // Force refresh templates when component mounts to get latest data
  useEffect(() => {
    const forceRefresh = async () => {
      await fetchEmailTemplates();
    };
    forceRefresh();
  }, []);

  const fetchEmailTemplates = async () => {
    try {
      console.log('[EmailManagement] Fetching email templates...');
      
      // Add timestamp to force cache invalidation
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      console.log('[EmailManagement] Fetched templates:', data);
      setTemplates(data || []);
      
      toast({
        title: "Templates Refreshed",
        description: `Loaded ${data?.length || 0} email templates`,
      });
    } catch (error: any) {
      console.error('[EmailManagement] Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email templates: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch email logs: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
            variables: template.variables,
            is_active: template.is_active,
            description: template.description,
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Email template updated successfully",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_key: template.template_key,
            name: template.name,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
            variables: template.variables || {},
            is_active: template.is_active !== false,
            description: template.description,
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Email template created successfully",
        });
      }

      fetchEmailTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save template: " + error.message,
        variant: "destructive",
      });
    }
  };

  const sendVariableTestEmail = async (templateKey: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(`${templateKey}-variables`);

    try {
      const { data, error } = await supabase.functions.invoke('test-email-variables', {
        body: {
          templateKey: templateKey,
          testUserEmail: testEmail
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test Email Sent with Real Data",
        description: `Successfully sent test email with dynamic user data to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Failed to send variable test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email with variables",
        variant: "destructive",
      });
    } finally {
      setSendingTest(null);
    }
  };

  const sendTestEmail = async (templateKey: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const template = templates.find(t => t.template_key === templateKey);
      if (!template) throw new Error("Template not found");

      // Create test variables based on template variables
      const testVariables: Record<string, string> = {};
      Object.keys(template.variables).forEach(key => {
        if (key === 'app_name') {
          testVariables[key] = 'PinkWizard';
        } else {
          testVariables[key] = `Test ${key}`;
        }
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          templateKey,
          recipientEmail: testEmail,
          variables: testVariables,
        },
      });

      if (error) throw error;

      // Check if the function returned an error in the response
      if (data && !data.success) {
        throw new Error(data.error || data.technical_error || 'Failed to send email');
      }

      toast({
        title: "Success",
        description: `Test email sent to ${testEmail}`,
      });

      fetchEmailLogs();
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
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin")}
              className="hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-primary">
                Email Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage email templates and monitor delivery performance
              </p>
            </div>
          </div>
          <div>
              <Button
                onClick={() => {
                  toast({
                    title: "Refreshing templates...",
                    description: "Loading latest template data",
                  });
                  fetchEmailTemplates();
                }}
                variant="outline"
                className="bg-background/50 hover:bg-background mr-3"
              >
                <Mail className="h-4 w-4 mr-2" />
                Refresh Templates
              </Button>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedTemplate(null)}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <EmailTemplateEditor
                template={selectedTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
              />
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 rounded-lg">
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger 
              value="triggers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium"
            >
              <Zap className="h-4 w-4 mr-2" />
              Triggers
            </TabsTrigger>
            <TabsTrigger 
              value="broadcast"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium"
            >
              <Users className="h-4 w-4 mr-2" />
              Challenge Broadcast
            </TabsTrigger>
            <TabsTrigger 
              value="logs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium"
            >
              Email Logs
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="triggers" className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Email Triggers Management
                </CardTitle>
                <CardDescription>
                  Control when and how emails are triggered across your system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailTriggers />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Challenge Email Broadcast
                </CardTitle>
                <CardDescription>
                  Send challenge-related emails to all active participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChallengeEmailBroadcast />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
                  
                  <CardHeader className="relative pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {template.name}
                        </CardTitle>
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className={`w-fit ${template.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100' 
                            : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription className="text-sm leading-relaxed mt-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Template Key</div>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                        {template.template_key}
                      </code>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Subject Line</div>
                      <div className="text-sm font-medium bg-muted/30 p-2 rounded-md border-l-2 border-primary/50">
                        {template.subject}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsEditing(true);
                        }}
                        className="h-9 text-xs hover:bg-primary/10 hover:border-primary/50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-9 text-xs hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl">Preview: {template.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Subject</Label>
                              <div className="p-3 bg-muted/50 rounded-lg font-medium">{template.subject}</div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">HTML Content</Label>
                              <div 
                                className="border rounded-lg p-6 bg-white dark:bg-muted/20 min-h-[200px]"
                                 dangerouslySetInnerHTML={{ 
                                   __html: (() => {
                                     let previewContent = template.html_content;
                                     // Replace template variables with their values for preview
                                     Object.entries(template.variables).forEach(([key, value]) => {
                                       const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                                       previewContent = previewContent.replace(placeholder, String(value));
                                     });
                                     // Use more permissive sanitization to allow email styling
                                     return DOMPurify.sanitize(previewContent, {
                                       ALLOWED_TAGS: ['html', 'head', 'body', 'style', 'title', 'meta', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'blockquote'],
                                       ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'charset', 'name', 'content', 'lang'],
                                       ALLOW_DATA_ATTR: false
                                     });
                                   })()
                                 }}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-9 text-xs hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Send Test Email</DialogTitle>
                            <DialogDescription>
                              Send a test email to verify the template works correctly
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="testEmail">Test Email Address</Label>
                              <Input
                                id="testEmail"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="test@example.com"
                                className="w-full"
                              />
                            </div>
                            <Button 
                              onClick={() => sendTestEmail(template.template_key)}
                              className="w-full"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Test Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  Email Delivery Logs
                </CardTitle>
                <CardDescription className="text-base">
                  Track all email delivery attempts and their status in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-muted/50">
                        <TableHead className="font-semibold text-foreground px-6 py-4">Template</TableHead>
                        <TableHead className="font-semibold text-foreground px-6 py-4">Recipient</TableHead>
                        <TableHead className="font-semibold text-foreground px-6 py-4">Subject</TableHead>
                        <TableHead className="font-semibold text-foreground px-6 py-4">Status</TableHead>
                        <TableHead className="font-semibold text-foreground px-6 py-4">Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow 
                          key={log.id} 
                          className={`border-b border-muted/30 hover:bg-muted/20 transition-colors ${
                            index % 2 === 0 ? 'bg-background/50' : 'bg-background/20'
                          }`}
                        >
                          <TableCell className="px-6 py-4">
                            <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono border">
                              {log.template_key}
                            </code>
                          </TableCell>
                          <TableCell className="px-6 py-4 font-medium">{log.recipient_email}</TableCell>
                          <TableCell className="px-6 py-4 max-w-xs">
                            <div className="truncate" title={log.subject}>
                              {log.subject}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="px-6 py-4 text-muted-foreground">
                            {log.sent_at 
                              ? format(new Date(log.sent_at), "MMM dd, yyyy HH:mm")
                              : format(new Date(log.created_at), "MMM dd, yyyy HH:mm")
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No email logs yet</h3>
                    <p className="text-muted-foreground">
                      Email delivery logs will appear here once you start sending emails
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Email Template Guide
                </CardTitle>
                <CardDescription className="text-base">
                  Understanding how email templates are triggered and managed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="defaultEmail" className="text-sm font-semibold">
                    Default Test Email Address
                  </Label>
                  <Input
                    id="defaultEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    This email address will be pre-filled when sending test emails
                  </p>
                </div>

                <Separator />

                <BrandColorReference />

                <Separator />

                <div className="space-y-4 pt-4 border-t border-muted/50">
                  <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold text-lg mb-2">📧 How Template Keys Work</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Each email template has a unique <code className="bg-background px-2 py-1 rounded">template_key</code> that identifies when and how it should be used:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-background rounded">
                        <code className="font-mono">welcome_email</code>
                        <span className="text-muted-foreground">Sent when new users sign up</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background rounded">
                        <code className="font-mono">password_reset</code>
                        <span className="text-muted-foreground">Sent when users request password reset</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background rounded">
                        <code className="font-mono">follow_up_reminder</code>
                        <span className="text-muted-foreground">Automated follow-up reminders</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-secondary">
                    <h3 className="font-semibold text-lg mb-2">🔧 Integration Options</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="font-medium">Manual Triggering:</h4>
                        <p className="text-muted-foreground">Use the test email feature or call the send-email edge function directly</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Supabase Auth Integration:</h4>
                        <p className="text-muted-foreground">Set up auth hooks to send custom password reset emails</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Application Events:</h4>
                        <p className="text-muted-foreground">Use <code className="bg-background px-1 rounded">useEmailNotifications</code> hook in your React components</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-accent">
                    <h3 className="font-semibold text-lg mb-2">💡 Creating New Templates</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">When creating new templates:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Choose a descriptive <code className="bg-background px-1 rounded">template_key</code> (e.g., "order_confirmation")</li>
                        <li>Define variables using <code className="bg-background px-1 rounded">{"{{variable_name}}"}</code> syntax</li>
                        <li>Add a clear description explaining when the template should be used</li>
                        <li>Use the test feature to preview with sample data</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-muted/50">
                  <h4 className="text-sm font-semibold mb-2">Email Delivery Status</h4>
                  <div className="text-sm text-muted-foreground">
                    Total emails sent today: <span className="font-medium text-foreground">{logs.filter(log => 
                      new Date(log.created_at).toDateString() === new Date().toDateString()
                    ).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

const EmailTemplateEditor = ({ template, onSave, onCancel }: EmailTemplateEditorProps) => {
  const [formData, setFormData] = useState({
    template_key: template?.template_key || "",
    name: template?.name || "",
    subject: template?.subject || "",
    html_content: template?.html_content || "",
    text_content: template?.text_content || "",
    variables: JSON.stringify(template?.variables || {}, null, 2),
    is_active: template?.is_active !== false,
    description: template?.description || "",
  });

  // Update form data when template prop changes
  useEffect(() => {
    setFormData({
      template_key: template?.template_key || "",
      name: template?.name || "",
      subject: template?.subject || "",
      html_content: template?.html_content || "",
      text_content: template?.text_content || "",
      variables: JSON.stringify(template?.variables || {}, null, 2),
      is_active: template?.is_active !== false,
      description: template?.description || "",
    });
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const variables = JSON.parse(formData.variables);
      onSave({
        ...formData,
        variables,
      });
    } catch (error) {
      alert("Invalid JSON in variables field");
    }
  };

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-card to-card/50 shadow-xl backdrop-blur-sm">
      <DialogHeader className="pb-6">
        <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
          <Edit className="h-6 w-6 text-primary" />
          {template ? "Edit Template" : "Create Template"}
        </DialogTitle>
        <DialogDescription className="text-base">
          Configure the email template settings and content with live preview
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="template_key" className="text-sm font-semibold">
              Template Key
            </Label>
            <Input
              id="template_key"
              value={formData.template_key}
              onChange={(e) => setFormData(prev => ({ ...prev, template_key: e.target.value }))}
              disabled={!!template}
              required
              className="bg-background/50"
              placeholder="e.g., welcome_email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Display Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="bg-background/50"
              placeholder="e.g., Welcome Email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Description
          </Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="bg-background/50"
            placeholder="Brief description of when this template is used"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-semibold">
            Subject Line
          </Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            required
            className="bg-background/50"
            placeholder="e.g., Welcome to {{app_name}}!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="html_content" className="text-sm font-semibold">
              HTML Content
            </Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
              rows={12}
              required
              className="bg-background/50 font-mono text-sm"
              placeholder="Enter HTML email template content..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_content" className="text-sm font-semibold">
              Text Content (Fallback)
            </Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
              rows={12}
              className="bg-background/50"
              placeholder="Plain text version for email clients that don't support HTML..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variables" className="text-sm font-semibold">
            Template Variables (JSON)
          </Label>
          <Textarea
            id="variables"
            value={formData.variables}
            onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
            rows={4}
            className="bg-background/50 font-mono text-sm"
            placeholder='{"user_name": "string", "app_name": "string"}'
          />
          <p className="text-xs text-muted-foreground">
            Define placeholder variables that can be replaced when sending emails
          </p>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active" className="text-sm font-medium">
            Active Template
          </Label>
          <p className="text-xs text-muted-foreground">
            Only active templates can be used to send emails
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-muted/50">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="shadow-lg hover:shadow-xl transition-shadow">
            <Edit className="h-4 w-4 mr-2" />
            {template ? "Update" : "Create"} Template
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default EmailManagement;