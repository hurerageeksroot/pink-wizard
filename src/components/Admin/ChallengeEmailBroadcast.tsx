import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  template_key: string;
  name: string;
  description: string;
  subject: string;
}

export const ChallengeEmailBroadcast: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailTemplates();
  }, []);

  const fetchEmailTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('template_key, name, description, subject')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Failed to fetch email templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select an email template to broadcast.",
        variant: "destructive"
      });
      return;
    }

    setBroadcasting(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.rpc('broadcast_challenge_email', {
        p_template_key: selectedTemplate
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; participant_count: number; template_key: string; message: string };
      setLastResult(result);
      toast({
        title: "Broadcast Scheduled! 📧",
        description: `Email broadcast has been scheduled for ${result.participant_count} challenge participants.`
      });
    } catch (error: any) {
      console.error('Broadcast error:', error);
      toast({
        title: "Broadcast Failed",
        description: error.message || "Failed to schedule email broadcast. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const selectedTemplateInfo = templates.find(t => t.template_key === selectedTemplate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Challenge Email Broadcast</CardTitle>
        </div>
        <CardDescription>
          Send emails to all active challenge participants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Email Template</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchEmailTemplates}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : (
            <>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose email template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.template_key} value={template.template_key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">{template.description}</span>
                        <span className="text-xs text-blue-600 font-mono">{template.subject}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateInfo && (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  <p><strong>{selectedTemplateInfo.name}</strong></p>
                  <p>{selectedTemplateInfo.description}</p>
                  <p className="text-xs mt-1 font-mono text-blue-600">{selectedTemplateInfo.subject}</p>
                </div>
              )}
            </>
          )}
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This will send emails to ALL active challenge participants. 
            Make sure you've selected the correct template and are ready to send.
          </AlertDescription>
        </Alert>

        {lastResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Last Broadcast Result:</strong></p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {lastResult.participant_count} recipients
                  </Badge>
                  <Badge variant="outline">
                    Template: {lastResult.template_key}
                  </Badge>
                </div>
                <p className="text-sm">{lastResult.message}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={handleBroadcast}
            disabled={!selectedTemplate || broadcasting}
            className="flex-1"
          >
            {broadcasting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Scheduling Broadcast...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to All Participants
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Emails are processed by the email function and may take a few minutes to send to all recipients.</p>
        </div>
      </CardContent>
    </Card>
  );
};