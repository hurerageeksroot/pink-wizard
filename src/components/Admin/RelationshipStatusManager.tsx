import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface RelationshipIntentConfig {
  id: string;
  intent: string;
  label: string;
  description?: string;
  icon_name: string;
  color_class: string;
  default_status: string;
}

interface RelationshipStatusOption {
  id: string;
  intent: string;
  status_key: string;
  label: string;
  description?: string;
  color_class: string;
  is_terminal: boolean;
  sort_order: number;
}

const COLOR_OPTIONS = [
  { value: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Gray' },
  { value: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Blue' },
  { value: 'bg-green-100 text-green-800 border-green-200', label: 'Green' },
  { value: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Yellow' },
  { value: 'bg-red-100 text-red-800 border-red-200', label: 'Red' },
  { value: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Purple' },
  { value: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Pink' },
  { value: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Indigo' },
  { value: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Orange' },
  { value: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Emerald' },
];

export const RelationshipStatusManager: React.FC = () => {
  const [selectedIntent, setSelectedIntent] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<RelationshipStatusOption | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState({
    status_key: '',
    label: '',
    description: '',
    color_class: 'bg-gray-100 text-gray-800 border-gray-200',
    is_terminal: false,
  });

  const queryClient = useQueryClient();

  // Fetch intent configurations with error handling
  const { data: intentConfigs = [], isLoading: loadingIntents, error: intentError } = useQuery({
    queryKey: ['relationship-intent-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_intent_configs')
        .select('*')
        .order('intent');
      if (error) throw error;
      return data as RelationshipIntentConfig[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch ALL status options with error handling
  const { data: allStatusOptions = [], isLoading: loadingStatuses, error: statusError } = useQuery({
    queryKey: ['relationship-status-options-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_status_options')
        .select('*')
        .order('intent, sort_order');
      if (error) throw error;
      return data as RelationshipStatusOption[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter status options for selected intent
  const statusOptions = allStatusOptions.filter(
    opt => opt.intent === selectedIntent
  );

  // Group status options by intent for the Intent Settings tab
  const statusOptionsByIntent = allStatusOptions.reduce((acc, option) => {
    if (!acc[option.intent]) {
      acc[option.intent] = [];
    }
    acc[option.intent].push(option);
    return acc;
  }, {} as Record<string, RelationshipStatusOption[]>);

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (status: typeof newStatus & { intent: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from('relationship_status_options')
        .insert([status])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-status-options'] });
      setIsCreateDialogOpen(false);
      setNewStatus({
        status_key: '',
        label: '',
        description: '',
        color_class: 'bg-gray-100 text-gray-800 border-gray-200',
        is_terminal: false,
      });
      toast.success('Status option created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create status option: ' + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: RelationshipStatusOption) => {
      const { data, error } = await supabase
        .from('relationship_status_options')
        .update({
          label: status.label,
          description: status.description,
          color_class: status.color_class,
          is_terminal: status.is_terminal,
          sort_order: status.sort_order,
        })
        .eq('id', status.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-status-options'] });
      setEditingStatus(null);
      toast.success('Status option updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update status option: ' + error.message);
    },
  });

  // Delete status mutation
  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase
        .from('relationship_status_options')
        .delete()
        .eq('id', statusId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-status-options'] });
      toast.success('Status option deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete status option: ' + error.message);
    },
  });

  // Update intent default status mutation
  const updateIntentMutation = useMutation({
    mutationFn: async ({ intent, defaultStatus }: { intent: string; defaultStatus: string }) => {
      const { data, error } = await supabase
        .from('relationship_intent_configs')
        .update({ default_status: defaultStatus })
        .eq('intent', intent)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-intent-configs'] });
      toast.success('Default status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update default status: ' + error.message);
    },
  });

  const handleCreateStatus = () => {
    if (!selectedIntent || !newStatus.status_key || !newStatus.label) {
      toast.error('Please fill in all required fields');
      return;
    }

    const nextSortOrder = Math.max(...statusOptions.map(s => s.sort_order), 0) + 1;
    
    createStatusMutation.mutate({
      ...newStatus,
      intent: selectedIntent,
      sort_order: nextSortOrder,
    });
  };

  const handleUpdateStatus = () => {
    if (!editingStatus) return;
    updateStatusMutation.mutate(editingStatus);
  };

  const handleDeleteStatus = (statusId: string) => {
    deleteStatusMutation.mutate(statusId);
  };

  const selectedIntentConfig = intentConfigs.find(config => config.intent === selectedIntent);

  if (loadingIntents) {
    return <div className="p-4">Loading relationship configurations...</div>;
  }

  if (intentError) {
    return (
      <div className="p-4 text-red-600">
        <p>Error loading relationship configurations: {intentError.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['relationship-intent-configs'] })}>
          Retry
        </Button>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="p-4 text-red-600">
        <p>Error loading status options: {statusError.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['relationship-status-options'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Relationship Status Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage status options for different relationship intents
          </p>
        </div>
      </div>

      <Tabs defaultValue="statuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statuses">Status Options</TabsTrigger>
          <TabsTrigger value="intents">Intent Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Relationship Intent</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedIntent} onValueChange={setSelectedIntent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an intent to manage its status options" />
                </SelectTrigger>
                <SelectContent>
                  {intentConfigs.map((config) => (
                    <SelectItem key={config.intent} value={config.intent}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedIntent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Status Options for {selectedIntentConfig?.label}</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    Default Status: <Badge variant="outline">{selectedIntentConfig?.default_status}</Badge>
                  </div>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Status Option</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status-key">Status Key *</Label>
                        <Input
                          id="status-key"
                          value={newStatus.status_key}
                          onChange={(e) => setNewStatus({ ...newStatus, status_key: e.target.value })}
                          placeholder="e.g., interested"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status-label">Label *</Label>
                        <Input
                          id="status-label"
                          value={newStatus.label}
                          onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                          placeholder="e.g., Interested"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status-description">Description</Label>
                        <Textarea
                          id="status-description"
                          value={newStatus.description}
                          onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                          placeholder="Describe when this status applies"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status-color">Color</Label>
                        <Select
                          value={newStatus.color_class}
                          onValueChange={(value) => setNewStatus({ ...newStatus, color_class: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${color.value}`} />
                                  {color.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-terminal"
                          checked={newStatus.is_terminal}
                          onChange={(e) => setNewStatus({ ...newStatus, is_terminal: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="is-terminal">Terminal Status (end of workflow)</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateStatus} disabled={createStatusMutation.isPending}>
                          Create Status
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingStatuses ? (
                  <div>Loading status options...</div>
                ) : (
                  <div className="space-y-3">
                    {statusOptions.map((status) => (
                      <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge className={status.color_class} variant="outline">
                            {status.label}
                          </Badge>
                          <div>
                            <p className="font-medium">{status.status_key}</p>
                            {status.description && (
                              <p className="text-sm text-muted-foreground">{status.description}</p>
                            )}
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>Order: {status.sort_order}</span>
                              {status.is_terminal && <Badge variant="secondary">Terminal</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStatus(status)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Status Option</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the "{status.label}" status option?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStatus(status.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intent Default Status Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {intentConfigs.map((config) => (
                  <div key={config.intent} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label>Default Status:</Label>
                      <Select
                        value={config.default_status || ''}
                        onValueChange={(value) => 
                          updateIntentMutation.mutate({ 
                            intent: config.intent, 
                            defaultStatus: value 
                          })
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select default status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(statusOptionsByIntent[config.intent] || []).map((option) => (
                            <SelectItem key={option.id} value={option.status_key}>
                              {option.label}
                            </SelectItem>
                          ))}
                          {(statusOptionsByIntent[config.intent] || []).length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No status options defined
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Status Dialog */}
      {editingStatus && (
        <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Status Option</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status Key</Label>
                <Input value={editingStatus.status_key} disabled />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={editingStatus.label}
                  onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingStatus.description || ''}
                  onChange={(e) => setEditingStatus({ ...editingStatus, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={editingStatus.color_class}
                  onValueChange={(value) => setEditingStatus({ ...editingStatus, color_class: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingStatus.sort_order}
                  onChange={(e) => setEditingStatus({ ...editingStatus, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-terminal"
                  checked={editingStatus.is_terminal}
                  onChange={(e) => setEditingStatus({ ...editingStatus, is_terminal: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-is-terminal">Terminal Status</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingStatus(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};