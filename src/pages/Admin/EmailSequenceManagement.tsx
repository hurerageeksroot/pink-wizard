import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Plus, Trash2, Mail, Clock, Play, Pause, Eye, Send, Users } from "lucide-react";
import { format } from "date-fns";

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  trigger_conditions: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  template_key: string;
  subject_override: string;
  conditions: any;
  is_active: boolean;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  is_active: boolean;
}

const EmailSequenceManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [steps, setSteps] = useState<EmailSequenceStep[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [selectedStep, setSelectedStep] = useState<EmailSequenceStep | null>(null);
  const [isEditingSequence, setIsEditingSequence] = useState(false);
  const [isEditingStep, setIsEditingStep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sequences");

  const triggerEvents = [
    { value: 'user_signup', label: 'User Sign Up' },
    { value: 'challenge_start', label: 'Challenge Start' },
    { value: 'challenge_complete', label: 'Challenge Complete' },
    { value: 'contact_added', label: 'Contact Added' },
    { value: 'no_activity_7_days', label: 'No Activity (7 days)' },
    { value: 'payment_received', label: 'Payment Received' },
  ];

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      
      // Fetch sequences
      const { data: sequencesData, error: sequencesError } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (sequencesError) throw sequencesError;
      setSequences(sequencesData || []);

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('email_sequence_steps')
        .select('*')
        .order('step_order', { ascending: true });

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('id, template_key, name, subject, html_content, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch email data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSequence = async (sequenceData: Partial<EmailSequence>) => {
    try {
      if (selectedSequence) {
        // Update existing sequence
        const { error } = await supabase
          .from('email_sequences')
          .update({
            name: sequenceData.name,
            description: sequenceData.description,
            trigger_event: sequenceData.trigger_event,
            trigger_conditions: sequenceData.trigger_conditions,
            is_active: sequenceData.is_active,
          })
          .eq('id', selectedSequence.id);

        if (error) throw error;
      } else {
        // Create new sequence
        const { error } = await supabase
          .from('email_sequences')
          .insert({
            name: sequenceData.name,
            description: sequenceData.description,
            trigger_event: sequenceData.trigger_event,
            trigger_conditions: sequenceData.trigger_conditions || {},
            is_active: sequenceData.is_active !== false,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Email sequence saved successfully",
      });
      
      setIsEditingSequence(false);
      setSelectedSequence(null);
      fetchEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save sequence: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveStep = async (stepData: Partial<EmailSequenceStep>) => {
    try {
      if (selectedStep) {
        // Update existing step
        const { error } = await supabase
          .from('email_sequence_steps')
          .update({
            step_order: stepData.step_order,
            delay_days: stepData.delay_days,
            delay_hours: stepData.delay_hours,
            template_key: stepData.template_key,
            subject_override: stepData.subject_override,
            conditions: stepData.conditions,
            is_active: stepData.is_active,
          })
          .eq('id', selectedStep.id);

        if (error) throw error;
      } else {
        // Create new step
        const { error } = await supabase
          .from('email_sequence_steps')
          .insert({
            sequence_id: stepData.sequence_id,
            step_order: stepData.step_order || 1,
            delay_days: stepData.delay_days || 0,
            delay_hours: stepData.delay_hours || 0,
            template_key: stepData.template_key,
            subject_override: stepData.subject_override,
            conditions: stepData.conditions || {},
            is_active: stepData.is_active !== false,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Email step saved successfully",
      });
      
      setIsEditingStep(false);
      setSelectedStep(null);
      fetchEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save step: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', sequenceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email sequence deleted successfully",
      });
      
      fetchEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete sequence: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('email_sequence_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email step deleted successfully",
      });
      
      fetchEmailData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete step: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStepsForSequence = (sequenceId: string) => {
    return steps.filter(step => step.sequence_id === sequenceId);
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
                Email Sequence Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage automated email sequences
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="sequences" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Sequences
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sequences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email Sequences</CardTitle>
                      <CardDescription>
                        Automated email campaigns triggered by user actions
                      </CardDescription>
                    </div>
                    <Dialog open={isEditingSequence} onOpenChange={setIsEditingSequence}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedSequence(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Sequence
                        </Button>
                      </DialogTrigger>
                      <SequenceEditor
                        sequence={selectedSequence}
                        triggerEvents={triggerEvents}
                        onSave={handleSaveSequence}
                        onCancel={() => {
                          setIsEditingSequence(false);
                          setSelectedSequence(null);
                        }}
                      />
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sequences.map((sequence) => (
                      <Card key={sequence.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{sequence.name}</h3>
                              <Badge variant={sequence.is_active ? "default" : "secondary"}>
                                {sequence.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{sequence.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Trigger: {triggerEvents.find(e => e.value === sequence.trigger_event)?.label}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSequence(sequence);
                                setIsEditingSequence(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSequence(sequence.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Email Steps</h4>
                            <Dialog open={isEditingStep} onOpenChange={setIsEditingStep}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedStep({ sequence_id: sequence.id } as EmailSequenceStep)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Step
                                </Button>
                              </DialogTrigger>
                              <StepEditor
                                step={selectedStep}
                                templates={templates}
                                onSave={handleSaveStep}
                                onCancel={() => {
                                  setIsEditingStep(false);
                                  setSelectedStep(null);
                                }}
                              />
                            </Dialog>
                          </div>
                          <div className="space-y-2">
                            {getStepsForSequence(sequence.id).map((step) => (
                              <div key={step.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium">Step {step.step_order}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {step.delay_days > 0 && `${step.delay_days} days `}
                                    {step.delay_hours > 0 && `${step.delay_hours} hours`}
                                    {step.delay_days === 0 && step.delay_hours === 0 && 'Immediate'}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Template: {step.template_key}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedStep(step);
                                      setIsEditingStep(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteStep(step.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Email Sequence Analytics</CardTitle>
                <CardDescription>
                  Track the performance of your email sequences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Analytics dashboard coming soon. Here you'll be able to track:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Email delivery rates</li>
                    <li>• Open and click-through rates</li>
                    <li>• Sequence completion rates</li>
                    <li>• User engagement metrics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const SequenceEditor = ({ 
  sequence, 
  triggerEvents, 
  onSave, 
  onCancel 
}: { 
  sequence: EmailSequence | null, 
  triggerEvents: Array<{value: string, label: string}>,
  onSave: (data: Partial<EmailSequence>) => void, 
  onCancel: () => void 
}) => {
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    description: sequence?.description || '',
    trigger_event: sequence?.trigger_event || '',
    trigger_conditions: sequence?.trigger_conditions || {},
    is_active: sequence?.is_active ?? true,
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{sequence ? 'Edit' : 'Create'} Email Sequence</DialogTitle>
        <DialogDescription>
          {sequence ? 'Update the sequence details' : 'Create a new automated email sequence'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sequence-name">Sequence Name</Label>
          <Input
            id="sequence-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Welcome Series"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sequence-description">Description</Label>
          <Textarea
            id="sequence-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="A series of welcome emails for new users"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trigger-event">Trigger Event</Label>
          <Select 
            value={formData.trigger_event} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trigger event" />
            </SelectTrigger>
            <SelectContent>
              {triggerEvents.map((event) => (
                <SelectItem key={event.value} value={event.value}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="sequence-active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="sequence-active">Active Sequence</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave(formData)} className="flex-1">
            {sequence ? 'Update' : 'Create'} Sequence
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

const StepEditor = ({ 
  step, 
  templates, 
  onSave, 
  onCancel 
}: { 
  step: EmailSequenceStep | null, 
  templates: EmailTemplate[],
  onSave: (data: Partial<EmailSequenceStep>) => void, 
  onCancel: () => void 
}) => {
  const [formData, setFormData] = useState({
    sequence_id: step?.sequence_id || '',
    step_order: step?.step_order || 1,
    delay_days: step?.delay_days || 0,
    delay_hours: step?.delay_hours || 0,
    template_key: step?.template_key || '',
    subject_override: step?.subject_override || '',
    conditions: step?.conditions || {},
    is_active: step?.is_active ?? true,
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{step?.id ? 'Edit' : 'Create'} Email Step</DialogTitle>
        <DialogDescription>
          {step?.id ? 'Update the step details' : 'Add a new step to the sequence'}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="step-order">Step Order</Label>
            <Input
              id="step-order"
              type="number"
              min="1"
              value={formData.step_order}
              onChange={(e) => setFormData(prev => ({ ...prev, step_order: parseInt(e.target.value) }))}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="step-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="step-active">Active Step</Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="delay-days">Delay (Days)</Label>
            <Input
              id="delay-days"
              type="number"
              min="0"
              value={formData.delay_days}
              onChange={(e) => setFormData(prev => ({ ...prev, delay_days: parseInt(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delay-hours">Delay (Hours)</Label>
            <Input
              id="delay-hours"
              type="number"
              min="0"
              max="23"
              value={formData.delay_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, delay_hours: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-key">Email Template</Label>
          <Select 
            value={formData.template_key} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, template_key: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select email template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.template_key} value={template.template_key}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject-override">Subject Override (Optional)</Label>
          <Input
            id="subject-override"
            value={formData.subject_override}
            onChange={(e) => setFormData(prev => ({ ...prev, subject_override: e.target.value }))}
            placeholder="Override template subject line"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSave(formData)} className="flex-1">
            {step?.id ? 'Update' : 'Create'} Step
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default EmailSequenceManagement;