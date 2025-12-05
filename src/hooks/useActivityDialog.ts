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
  const { canWrite, checkAccess } = useAccess();

  const openDialog = (contact: Contact) => {
    setDialogState({
      isOpen: true,
      contact,
      editingActivity: null
    });
  };

  const openEditDialog = (contact: Contact, activity: Activity) => {
    setDialogState({
      isOpen: true,
      contact,
      editingActivity: activity
    });
  };

  const closeDialog = () => {
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
    messageContent?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => {
    // Force fresh access check before critical operation
    await checkAccess();
    
    // Access control is enforced HERE at save time, not at button click
    if (!canWrite) {
      toast.error('You need an active subscription to log touchpoints');
      return false;
    }

    if (!dialogState.contact) {
      toast.error('No contact selected');
      return false;
    }

    const isEditing = !!dialogState.editingActivity;
    
    try {
      await saveActivity({
        id: isEditing ? dialogState.editingActivity?.id : undefined,
        contactId: dialogState.contact.id,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        messageContent: payload.messageContent,
        responseReceived: payload.responseReceived,
        createdAt: isEditing ? dialogState.editingActivity?.createdAt : new Date(),
        completedAt: payload.when,
        scheduledFor: payload.nextFollowUp, // This will update contact's next_follow_up
      });

      toast.success(isEditing ? 'Activity updated successfully' : 'Touchpoint logged successfully');
      closeDialog();
      return true;
    } catch (error) {
      
      // Show specific error messages based on error type
      let errorMessage = isEditing ? 'Failed to update activity' : 'Failed to log touchpoint';
      
      if (error.message?.includes('violates row-level security policy')) {
        errorMessage = 'You need an active subscription to log touchpoints';
      } else if (error.message?.includes('duplicate key') && error.message?.includes('activities')) {
        errorMessage = 'This touchpoint already exists for this contact';
      } else if (error.message?.includes('null value')) {
        errorMessage = 'Please fill in all required fields';
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
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