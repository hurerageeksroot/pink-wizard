import { useState } from 'react';
import { Contact, TouchpointType, Activity } from '@/types/crm';
import { useCRMData } from './useCRMData';
import { useAccess } from './useAccess';
import { toast } from 'sonner';

interface ActivityDialogState {
  isOpen: boolean;
  contact: Contact | null;
  editingActivity: Activity | null;
}

export const useActivityDialog = () => {
  const [dialogState, setDialogState] = useState<ActivityDialogState>({
    isOpen: false,
    contact: null,
    editingActivity: null
  });
  const { saveActivity } = useCRMData();
  const { canWrite } = useAccess();

  const openDialog = (contact: Contact) => {
    console.log('[useActivityDialog] Opening dialog for:', contact.name);
    setDialogState({
      isOpen: true,
      contact,
      editingActivity: null
    });
  };

  const openEditDialog = (contact: Contact, activity: Activity) => {
    console.log('[useActivityDialog] Opening edit dialog for activity:', activity.id);
    setDialogState({
      isOpen: true,
      contact,
      editingActivity: activity
    });
  };

  const closeDialog = () => {
    console.log('[useActivityDialog] Closing dialog');
    setDialogState({
      isOpen: false,
      contact: null,
      editingActivity: null
    });
  };

  const saveTouchpoint = async (payload: {
    type: TouchpointType;
    title: string;
    description?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => {
    console.log('🔥 [useActivityDialog] saveTouchpoint called - DEBUG:', {
      type: payload.type,
      title: payload.title,
      canWrite,
      contactId: dialogState.contact?.id,
      contactName: dialogState.contact?.name,
      isEditing: !!dialogState.editingActivity
    });

    // Access control is enforced HERE at save time, not at button click
    if (!canWrite) {
      console.error('🔥 [useActivityDialog] BLOCKED - No write access');
      toast.error('You need an active subscription to log touchpoints');
      return false;
    }

    if (!dialogState.contact) {
      console.error('🔥 [useActivityDialog] BLOCKED - No contact selected');
      toast.error('No contact selected');
      return false;
    }

    const isEditing = !!dialogState.editingActivity;
    
    try {
      console.log('🔥 [useActivityDialog] About to call saveActivity with payload:', {
        contactId: dialogState.contact.id,
        contactName: dialogState.contact.name,
        activityId: dialogState.editingActivity?.id,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        responseReceived: payload.responseReceived,
        when: payload.when,
        nextFollowUp: payload.nextFollowUp,
        hasNextFollowUp: !!payload.nextFollowUp,
        isEditing
      });
      
      await saveActivity({
        id: isEditing ? dialogState.editingActivity?.id : undefined,
        contactId: dialogState.contact.id,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        responseReceived: payload.responseReceived,
        createdAt: isEditing ? dialogState.editingActivity?.createdAt : new Date(),
        completedAt: payload.when,
        scheduledFor: payload.nextFollowUp, // This will update contact's next_follow_up
      });

      console.log('🔥 [useActivityDialog] saveActivity completed successfully');
      toast.success(isEditing ? 'Activity updated successfully' : 'Touchpoint logged successfully');
      closeDialog();
      return true;
    } catch (error) {
      console.error('🔥 [useActivityDialog] ERROR in saveActivity:', error);
      
      // Show specific error messages based on error type
      let errorMessage = isEditing ? 'Failed to update activity' : 'Failed to log touchpoint';
      
      if (error.message?.includes('violates row-level security policy')) {
        errorMessage += ' - Please check your permissions and try again.';
      } else if (error.message?.includes('duplicate key')) {
        errorMessage += ' - This entry may already exist.';
      } else if (error.message?.includes('null value')) {
        errorMessage += ' - Please fill in all required fields.';
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    isOpen: dialogState.isOpen,
    contact: dialogState.contact,
    editingActivity: dialogState.editingActivity,
    openDialog,
    openEditDialog,
    closeDialog,
    saveTouchpoint
  };
};