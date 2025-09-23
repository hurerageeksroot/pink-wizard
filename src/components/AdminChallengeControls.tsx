import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Plus, StopCircle, Calendar as CalendarIcon, Users, Settings as SettingsIcon, Edit } from 'lucide-react';
import { useChallengeAdmin } from '@/hooks/useChallengeAdmin';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdminChallengeControls() {
  const { challenges, loading, createChallenge, endChallenge, updateChallengeDay, updateChallenge } = useChallengeAdmin();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    start_date: new Date(),
    end_date: new Date()
  });

  const handleCreateChallenge = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsCreating(true);
    try {
      await createChallenge(formData);
      toast.success('Challenge created successfully!');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', start_date: '', end_date: '' });
    } catch (error) {
      toast.error('Failed to create challenge');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndChallenge = async (challengeId: string) => {
    try {
      await endChallenge(challengeId);
      toast.success('Challenge ended successfully');
    } catch (error) {
      toast.error('Failed to end challenge');
      console.error(error);
    }
  };

  const handleUpdateChallenge = async () => {
    if (!editFormData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editFormData.end_date <= editFormData.start_date) {
      toast.error('End date must be after start date');
      return;
    }

    setIsUpdating(true);
    try {
      const activeChallenge = challenges.find(c => c.is_active);
      if (activeChallenge) {
        await updateChallenge(activeChallenge.id, {
          name: editFormData.name,
          start_date: editFormData.start_date.toISOString().split('T')[0],
          end_date: editFormData.end_date.toISOString().split('T')[0]
        });
        toast.success('Challenge updated successfully!');
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      toast.error('Failed to update challenge');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditDialog = () => {
    const activeChallenge = challenges.find(c => c.is_active);
    if (activeChallenge) {
      setEditFormData({
        name: activeChallenge.name,
        start_date: new Date(activeChallenge.start_date),
        end_date: new Date(activeChallenge.end_date)
      });
      setIsEditDialogOpen(true);
    }
  };

  const activeChallenge = challenges.find(c => c.is_active);
  
  // Derive current day and total days from dates instead of using raw database values
  const getDerivedChallengeData = (challenge: any) => {
    if (!challenge) return { currentDay: 1, totalDays: 75, isActive: false };
    
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    const currentDate = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isActive = challenge.is_active && currentDate >= startDate && currentDate <= endDate;
    
    let currentDay = 1;
    if (isActive) {
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      currentDay = Math.max(1, Math.min(daysDiff + 1, totalDays));
    }
    
    return { currentDay, totalDays, isActive };
  };
  
  const derivedData = getDerivedChallengeData(activeChallenge);

  return (
    <div className="space-y-6">
      {/* Active Challenge Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Current Challenge Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeChallenge ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{activeChallenge.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activeChallenge.start_date), 'MMM d, yyyy')} - {format(new Date(activeChallenge.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Day</Label>
                  <p className="text-2xl font-bold">{derivedData.currentDay}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Days</Label>
                  <p className="text-2xl font-bold">{derivedData.totalDays}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Challenge
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <StopCircle className="h-4 w-4 mr-2" />
                      End Challenge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>End Current Challenge?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately end the active challenge "{activeChallenge.name}". 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleEndChallenge(activeChallenge.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        End Challenge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Active Challenge</h3>
              <p className="text-muted-foreground mb-4">Create a new challenge to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Challenge Dialog */}
      {activeChallenge && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Challenge</DialogTitle>
              <DialogDescription>
                Update the current challenge details. Changes will affect the ongoing challenge.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-challenge-name">Challenge Name</Label>
                <Input
                  id="edit-challenge-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer 75 Challenge"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !editFormData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.start_date ? format(editFormData.start_date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.start_date}
                        onSelect={(date) => date && setEditFormData(prev => ({ ...prev, start_date: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !editFormData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.end_date ? format(editFormData.end_date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.end_date}
                        onSelect={(date) => date && setEditFormData(prev => ({ ...prev, end_date: date }))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Show computed total days as read-only preview */}
              <div>
                <Label className="text-xs text-muted-foreground">Computed Total Days</Label>
                <p className="text-sm font-medium mt-1">
                  {editFormData.start_date && editFormData.end_date 
                    ? Math.ceil((editFormData.end_date.getTime() - editFormData.start_date.getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : 'Select dates to see total days'
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateChallenge} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Challenge'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create New Challenge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Challenge Management
          </CardTitle>
          <CardDescription>
            Create and manage challenges for your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Challenge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
                <DialogDescription>
                  Set up a new challenge period. This will deactivate any current active challenge.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="challenge-name">Challenge Name</Label>
                  <Input
                    id="challenge-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer 75 Challenge"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {/* Show computed total days as read-only preview */}
                <div>
                  <Label className="text-xs text-muted-foreground">Computed Total Days</Label>
                  <p className="text-sm font-medium mt-1">
                    {formData.start_date && formData.end_date 
                      ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      : 'Select dates to see total days'
                    }
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChallenge} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Challenge'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Challenge History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Challenge History
          </CardTitle>
          <CardDescription>
            Previous and current challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded border animate-pulse">
                  <div>
                    <div className="w-32 h-4 bg-muted rounded mb-2" />
                    <div className="w-48 h-3 bg-muted rounded" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No challenges created yet</p>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="flex items-center justify-between p-3 rounded border">
                  <div>
                    <h4 className="font-medium">{challenge.name}</h4>
                     <p className="text-sm text-muted-foreground">
                       {format(new Date(challenge.start_date), 'MMM d, yyyy')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')} • {getDerivedChallengeData(challenge).totalDays} days
                     </p>
                  </div>
                  <Badge variant={challenge.is_active ? "default" : "secondary"}>
                    {challenge.is_active ? "Active" : "Ended"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}