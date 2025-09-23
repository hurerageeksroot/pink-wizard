import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  company_name: string | null;
  location: string | null;
  show_in_leaderboard: boolean;
}

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function UserEditDialog({ user, isOpen, onClose, onSave }: UserEditDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    display_name: "",
    company_name: "",
    location: "",
    show_in_leaderboard: true,
  });
  const [saving, setSaving] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        display_name: user.display_name || "",
        company_name: user.company_name || "",
        location: user.location || "",
        show_in_leaderboard: user.show_in_leaderboard,
      });
      setEmailChanged(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Handle email change if needed
      if (emailChanged && formData.email !== user.email) {
        const { data, error: emailError } = await supabase.functions.invoke('admin-change-email', {
          body: {
            userId: user.id,
            oldEmail: user.email,
            newEmail: formData.email
          }
        });

        if (emailError) {
          throw new Error(`Failed to update email: ${emailError.message}`);
        }
      }

      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          company_name: formData.company_name || null,
          location: formData.location || null,
          show_in_leaderboard: formData.show_in_leaderboard,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: emailChanged ? "User profile and email updated successfully" : "User profile updated successfully",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile information and email address.
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  setEmailChanged(e.target.value !== user.email);
                }}
                className="col-span-3"
                placeholder="Enter email address"
                type="email"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="display_name" className="text-right">
                Display Name
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter display name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_name" className="text-right">
                Company
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter company name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="col-span-3"
                placeholder="Enter location"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaderboard" className="text-right">
                Show in Leaderboard
              </Label>
              <Switch
                id="leaderboard"
                checked={formData.show_in_leaderboard}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_leaderboard: checked }))}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}