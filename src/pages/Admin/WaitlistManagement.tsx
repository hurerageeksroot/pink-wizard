import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WaitlistEntry {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  referral_source: string | null;
  status: string;
  invited_at: string | null;
  created_at: string;
}

export default function WaitlistManagement() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch waitlist entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WaitlistEntry[];
    }
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (waitlist_id: string) => {
      const { data, error } = await supabase.functions.invoke('approve-waitlist-user', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: { waitlist_id, grant_trial: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'User Approved',
        description: 'User account created and invitation sent.',
      });
      setShowApproveDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user',
        variant: 'destructive',
      });
    }
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast({
        title: 'Entry Deleted',
        description: 'Waitlist entry removed.',
      });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user waitlist approvals and invitations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['waitlist'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">Loading waitlist...</div>
        ) : entries && entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {entry.first_name || entry.last_name
                      ? `${entry.first_name || ''} ${entry.last_name || ''}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell>{entry.email}</TableCell>
                  <TableCell>{entry.company || '-'}</TableCell>
                  <TableCell>{entry.position || '-'}</TableCell>
                  <TableCell>{entry.referral_source || '-'}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {entry.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No waitlist entries yet
          </div>
        )}
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User</AlertDialogTitle>
            <AlertDialogDescription>
              This will create an account for {selectedEntry?.email} and send them an invitation
              email with a password reset link. They will also receive a 14-day trial with 1,500 AI tokens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEntry && approveMutation.mutate(selectedEntry.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve & Send Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Waitlist Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the waitlist entry for {selectedEntry?.email}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}