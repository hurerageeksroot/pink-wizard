import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { useChallengeParticipantCount } from "@/hooks/useChallengeParticipantCount";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Shield, User, Crown, RotateCcw, Edit, Target, Calendar, TrendingUp, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserEditDialog } from "@/components/Admin/UserEditDialog";

export default function UserManagement() {
  const { users, loading, updateUserRole, deleteUser, fetchUsers, toggleUserChallenge } = useAdminData();
  const { count: totalParticipantCount, refetch: refetchParticipantCount } = useChallengeParticipantCount();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; email: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRoleChange = async (userId: string, role: 'admin' | 'user' | 'moderator', action: 'add' | 'remove') => {
    try {
      await updateUserRole(userId, role, action);
      await fetchUsers();
      toast.success(`User role ${action === 'add' ? 'added' : 'removed'} successfully`);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      await deleteUser(deletingUser.id, deletingUser.email);
      await fetchUsers();
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setDeletingUser(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ email: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPasswordClick = (userEmail: string, userName: string) => {
    setResetPasswordUser({ email: userEmail, name: userName });
    const randomPassword = generateRandomPassword();
    setNewPassword(randomPassword);
    setGeneratedPassword(randomPassword);
    setShowPasswordResetDialog(true);
    setShowGeneratedPassword(false);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          email: resetPasswordUser.email,
          newPassword: newPassword 
        }
      });
      
      if (error) throw error;
      
      setShowGeneratedPassword(true);
      toast.success('Password reset successfully! Please share the new password with the user.');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleChallengeToggle = async (userId: string, enabled: boolean) => {
    try {
      await toggleUserChallenge(userId, enabled);
      // Refresh participant count after toggle
      await refetchParticipantCount();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('admin')) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (roles.includes('moderator')) return <Shield className="h-4 w-4 text-blue-600" />;
    return <User className="h-4 w-4 text-gray-600" />;
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and challenge participation
        </p>
      </div>

      {/* Challenge Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Users</div>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground">
                of {users.length} total users
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Challenge Participants</div>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredUsers.filter(u => u.challenge_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredUsers.length > 0 ? 
                ((filteredUsers.filter(u => u.challenge_active).length / filteredUsers.length) * 100).toFixed(1) : 0}% of {searchQuery ? 'filtered' : 'all'} users
            </p>
            <p className="text-xs text-green-600 font-medium mt-1">
              Total DB: {totalParticipantCount} participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Avg. Days Completed</div>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredUsers.filter(u => u.challenge_active).length > 0 ?
                Math.round(filteredUsers.filter(u => u.challenge_active)
                  .reduce((sum, u) => sum + (u.challenge_days_completed || 0), 0) / 
                  filteredUsers.filter(u => u.challenge_active).length) : 0
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Avg. Progress</div>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredUsers.filter(u => u.challenge_active).length > 0 ?
                Math.round(filteredUsers.filter(u => u.challenge_active)
                  .reduce((sum, u) => sum + (u.challenge_progress || 0), 0) / 
                  filteredUsers.filter(u => u.challenge_active).length) : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-2 border-border/50 focus:border-primary/50 shadow-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user roles, challenge participation, and account settings. 
            {filteredUsers.filter(u => u.challenge_active).length} users are currently participating in challenges.
            {searchQuery && ` Showing ${filteredUsers.length} of ${users.length} users.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || 'User'} 
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{user.display_name || 'Unnamed'}</div>
                          <div className="text-sm text-muted-foreground">{user.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{user.email}</div>
                        {user.email_confirmed_at ? (
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.company_name || 'Not specified'}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.challenge_active || false}
                            onCheckedChange={(checked) => handleChallengeToggle(user.id, checked)}
                          />
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <Badge variant={user.challenge_active ? "default" : "secondary"} className="text-xs">
                              {user.challenge_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        {user.challenge_active && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {user.challenge_joined_at ? 
                                  `Joined ${new Date(user.challenge_joined_at).toLocaleDateString()}` : 
                                  'No join date'
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{user.challenge_days_completed || 0} days • {user.challenge_progress || 0}% progress</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.roles)}
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">user</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? (
                        <span className="text-sm">
                          {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => {
                          const [action, role] = value.split(':');
                          handleRoleChange(user.id, role as any, action as any);
                        }}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add:admin">Add Admin</SelectItem>
                            <SelectItem value="add:moderator">Add Moderator</SelectItem>
                            <SelectItem value="remove:admin">Remove Admin</SelectItem>
                            <SelectItem value="remove:moderator">Remove Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditDialog(true);
                          }}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPasswordClick(user.email, user.display_name || 'User')}
                          title="Reset Password"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingUser({ id: user.id, email: user.email });
                            setShowDeleteDialog(true);
                          }}
                          title="Delete User"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <AlertDialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password for {resetPasswordUser?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a new password for {resetPasswordUser?.email}. The user will need to use this new password to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="font-mono"
                  placeholder="Generated password"
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const password = generateRandomPassword();
                    setNewPassword(password);
                    setGeneratedPassword(password);
                  }}
                >
                  Generate
                </Button>
              </div>
            </div>
            
            {showGeneratedPassword && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Password reset successfully! Share this password with the user:
                </p>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white border rounded text-sm font-mono">
                    {generatedPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      toast.success('Password copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowPasswordResetDialog(false);
                setResetPasswordUser(null);
                setNewPassword('');
                setShowGeneratedPassword(false);
              }}
            >
              {showGeneratedPassword ? 'Close' : 'Cancel'}
            </AlertDialogCancel>
            {!showGeneratedPassword && (
              <AlertDialogAction 
                onClick={handleResetPassword}
                disabled={!newPassword}
              >
                Reset Password
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user "{deletingUser?.email}"? 
              This action cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserEditDialog
        user={editingUser}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingUser(null);
        }}
        onSave={() => {
          fetchUsers();
        }}
      />
    </div>
  );
}