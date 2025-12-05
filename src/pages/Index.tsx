import React, { useState, useEffect } from "react";
import { Contact, Activity, TouchpointType } from "@/types/crm";
import { DashboardLayout } from "@/components/Dashboard/DashboardLayout";
import { useChallenge } from "@/hooks/useChallenge";
import { ChallengeAccessGate } from "@/components/ChallengeAccessGate";
import { ContactList } from "@/components/ContactList";
import { ContactForm } from "@/components/ContactForm";
import { ActivitiesTable } from "@/components/ActivitiesTable";
import { DailyTasks } from "@/components/DailyTasks";
import { NetworkingEvents } from "@/components/NetworkingEvents";
import { NetworkingAnalyticsWidget } from "@/components/NetworkingAnalyticsWidget";
import { ActivitiesAnalyticsWidget } from "@/components/ActivitiesAnalyticsWidget";
import { WelcomeModal } from "@/components/Onboarding/WelcomeModal";
import { CoachBanner } from "@/components/CoachBanner";
import { RevenueDialog } from "@/components/RevenueDialog";
import { CommunityFeed } from "@/components/CommunityFeed";
import { PointsCard } from "@/components/PointsCard";
import { PointsToast } from "@/components/PointsToast";
import { RewardNotifications } from "@/components/RewardNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Activity as ActivityIcon,
  Settings,
  LogOut,
  LogIn,
  Sparkles,
  Menu,
  CheckSquare,
  HelpCircle,
  Target,
  Network,
  BookOpen,
  Info,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useCRMData } from "@/hooks/useCRMData";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useAccess } from "@/hooks/useAccess";
import { useExternalCounts } from "@/hooks/useExternalCounts";
import { useOutreachReconciliation } from "@/hooks/useOutreachReconciliation";

import { useGlobalData } from "@/hooks/useGlobalData";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useActivityDialog } from "@/hooks/useActivityDialog";
import { computeNextFollowUp } from "@/utils/followUpCadence";
import { ActivityDialog } from "@/components/ActivityDialog";
import { PublicLanding } from "@/components/marketing/PublicLanding";

const Index: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle post-checkout success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get("checkout");

    if (checkoutStatus === "success") {
      toast({
        title: "Payment Successful!",
        description: "Your subscription is now active. Welcome to Pro!",
      });

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("checkout");
      window.history.replaceState({}, "", cleanUrl.toString());
    } else if (checkoutStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description:
          "Your subscription setup was cancelled. You can try again anytime.",
        variant: "destructive",
      });

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("checkout");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, [toast]);

  // Handle 75Hard token authentication
  useEffect(() => {
    const handleTokenAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token");

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            toast({
              title: "Authentication Error",
              description:
                "Invalid tokens from 75Hard. Please try signing in normally.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Welcome from 75Hard!",
              description: "You've been successfully authenticated.",
            });

            // Auto-enroll as challenge participant
            try {
              await supabase.functions.invoke("enroll-challenge-participant", {
                headers: {
                  Authorization: `Bearer ${data.session?.access_token}`,
                },
              });
            } catch (enrollError) {
              console.error("Challenge enrollment failed:", enrollError);
            }

            // Clean URL
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("access_token");
            cleanUrl.searchParams.delete("refresh_token");
            cleanUrl.searchParams.delete("user_id");
            cleanUrl.searchParams.delete("user_email");

            const shouldShowOnboarding = urlParams.get("onboarding") === "true";
            if (shouldShowOnboarding) {
              cleanUrl.searchParams.set("onboarding", "true");
            }

            window.history.replaceState(
              {},
              document.title,
              cleanUrl.toString()
            );
          }
        } catch (error) {
          toast({
            title: "Authentication Failed",
            description:
              "Unable to authenticate from 75Hard. Please sign in normally.",
            variant: "destructive",
          });
        }
      }
    };

    handleTokenAuthentication();
  }, [toast]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show public landing page if not authenticated
  if (!user) {
    return <PublicLanding />;
  }

  // Show authenticated dashboard
  return <AuthenticatedApp />;
};

// Separate component for authenticated content with all hooks
const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentDay } = useChallenge(); // Only get challenge day, not participation
  const { hasContacts, challengeParticipant } = useGlobalData();
  const queryClient = useQueryClient();
  const {
    contacts,
    activities,
    stats,
    loading: crmDataLoading,
    hasRealData,
    showDemoData,
    setShowDemoData,
    saveContact,
    saveActivity,
    deleteActivity,
  } = useCRMData();
  const { canWrite, isChallengeParticipant } = useAccess(); // Get challenge participation from access
  const { isInIframe, isEmbeddedMode, getTodaysCounts } = useExternalCounts();
  const { logOutreachActivity, reconcileOutreach, addContactToTaskNotes } =
    useOutreachReconciliation();

  const { settings: crmSettings } = useCRMSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if we're on a Lovable domain and force standalone mode
  const isLovableDomain =
    window.location.hostname.includes("lovable.") ||
    window.location.hostname.includes("sandbox.lovable.");

  // Override iframe detection for Lovable domains
  const effectiveIsInIframe = isLovableDomain ? false : isInIframe;

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCoachBanner, setShowCoachBanner] = useState(true);
  const [urlFilter, setUrlFilter] = useState<string | null>(null);

  // Centralized activity dialog
  const activityDialog = useActivityDialog();

  // Diagnostic: Log when contacts data changes
  useEffect(() => {
    if (user) {
      console.log("[Index] CRM Data loaded:", {
        contactCount: contacts?.length || 0,
        activitiesCount: activities?.length || 0,
        isLoading: crmDataLoading,
        userId: user.id,
      });
    }
  }, [contacts, activities, user, crmDataLoading]);

  // Handle authentication redirects and onboarding
  useEffect(() => {
    if (isLovableDomain) {
      console.log("[Index] Lovable domain detected - forcing standalone mode");
      localStorage.removeItem("pinkwizard-external-counts");
      localStorage.removeItem("pinkwizard-iframe-mode");
    }

    console.log("[Index] Auth check:", {
      user: !!user,
      isInIframe: effectiveIsInIframe,
      isLovableDomain,
      hostname: window.location.hostname,
    });

    // Handle coach banner dismissal for authenticated users
    if (user) {
      // Store current user ID for welcome modal reference
      localStorage.setItem("current-user-id", user.id);

      const coachDismissed = localStorage.getItem(`coach-dismissed-${user.id}`);
      setShowCoachBanner(!coachDismissed);

      // Check if user should see onboarding
      const urlParams = new URLSearchParams(window.location.search);
      const shouldShowOnboarding = urlParams.get("onboarding") === "true";
      const hasSeenWelcome = localStorage.getItem(`welcome-seen-${user.id}`);

      // Force show onboarding if URL parameter is present, regardless of whether they've seen it before
      if (shouldShowOnboarding) {
        console.log(
          "[Index] Onboarding parameter detected - showing welcome modal"
        );
        setShowWelcomeModal(true);
        // Don't set the localStorage flag yet - let them complete the onboarding

        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("onboarding");
        window.history.replaceState({}, "", newUrl.pathname + newUrl.search);
      } else if (!hasSeenWelcome) {
        // Only show for truly new users who haven't seen it and don't have the URL param
        console.log("[Index] New user detected - showing welcome modal");
        setShowWelcomeModal(true);
        localStorage.setItem(`welcome-seen-${user.id}`, "true");
      }
    }
  }, [user, navigate, effectiveIsInIframe]);

  // Sync tab and filter with URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    const filterParam = urlParams.get("filter");

    if (
      tabParam &&
      [
        "dashboard",
        "contacts",
        "activities",
        "tasks",
        "networking",
        "community",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }

    if (filterParam) {
      setUrlFilter(filterParam);
    }
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    // Clear filter when changing tabs unless going to contacts
    if (tab !== "contacts") {
      url.searchParams.delete("filter");
      setUrlFilter(null);
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactFormOpen(true);
  };

  const handleAddContact = async () => {
    try {
      // Create a draft contact immediately so context tags work
      const draftContact: Partial<Contact> = {
        name: "New Contact",
        email: "",
        status: "none",
        relationshipType: "lead",
        relationshipIntent: "business_lead_statuses",
        relationshipStatus: "new",
        category: "uncategorized",
        source: "",
        createdAt: new Date(),
        totalTouchpoints: 0,
        responseReceived: false,
        bookingScheduled: false,
        archived: false,
      };

      // Save the draft to get an ID
      await saveContact(draftContact);

      // Refetch to get the newly created contact with its ID
      await queryClient.invalidateQueries({ queryKey: ["crmData", user?.id] });

      // Wait a brief moment for the query to update
      setTimeout(() => {
        // Find the most recently created contact (should be our draft)
        const sortedContacts = [...contacts].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const newDraft = sortedContacts[0];

        if (newDraft) {
          setSelectedContact(newDraft);
          setIsContactFormOpen(true);
        } else {
          // Fallback to old behavior if something went wrong
          setSelectedContact(null);
          setIsContactFormOpen(true);
        }
      }, 500);
    } catch (error) {
      console.error("Error creating draft contact:", error);
      // Fallback to old behavior on error
      setSelectedContact(null);
      setIsContactFormOpen(true);
    }
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      if (contactData.id) {
        // Update existing contact
        const updatedData = {
          ...contactData,
          // Handle status transitions
          bookingScheduled:
            contactData.status === "won" ? true : contactData.bookingScheduled,
          relationshipType:
            contactData.status === "won"
              ? "booked_client"
              : contactData.status === "lost_maybe_later" ||
                contactData.status === "lost_not_fit"
              ? "lead"
              : contactData.relationshipType,
        };
        await saveContact(updatedData);
        toast({
          title: "Contact Updated",
          description: `${contactData.name} has been updated.`,
        });
        // Close dialog after successful save
        setIsContactFormOpen(false);
        setSelectedContact(null);
      } else {
        // Add new contact
        const newContactData = {
          ...contactData,
          createdAt: new Date(),
          totalTouchpoints: 0,
          responseReceived: false,
          bookingScheduled: false,
          archived: false,
        };

        // Auto-set follow-up date if not provided and settings allow it
        if (!newContactData.nextFollowUp && crmSettings.auto_followup_enabled) {
          const autoFollowUp = computeNextFollowUp(
            newContactData as Contact,
            crmSettings
          );
          if (autoFollowUp) {
            newContactData.nextFollowUp = autoFollowUp;
            toast({
              title: "Auto follow-up scheduled",
              description: `Follow-up set for ${autoFollowUp.toLocaleDateString()}`,
            });
          }
        }

        await saveContact(newContactData);
        toast({
          title: "Contact Added",
          description: `${contactData.name} has been added to your contacts.`,
        });
        // Close dialog after successful save
        setIsContactFormOpen(false);
        setSelectedContact(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContactStatus = async (
    contactId: string,
    status: Contact["status"]
  ) => {
    try {
      const contactToUpdate = contacts.find((c) => c.id === contactId);
      if (!contactToUpdate) return;

      const updatedContact = {
        ...contactToUpdate,
        status,
        // Smart coupling: won status should automatically set relationship to booked_client
        relationshipType:
          status === "won" ? "booked_client" : contactToUpdate.relationshipType,
        bookingScheduled: ["won", "hot"].includes(status)
          ? true
          : contactToUpdate.bookingScheduled,
      };

      // Cache will be updated automatically by React Query after saveContact

      // Auto-set follow-up date if changing status and no current follow-up exists
      if (!updatedContact.nextFollowUp && crmSettings.auto_followup_enabled) {
        const autoFollowUp = computeNextFollowUp(updatedContact, crmSettings);
        if (autoFollowUp) {
          updatedContact.nextFollowUp = autoFollowUp;
          toast({
            title: "Auto follow-up scheduled",
            description: `Follow-up set for ${autoFollowUp.toLocaleDateString()}`,
          });
        }
      }

      // Persist to database
      await saveContact(updatedContact);

      const statusLabel = {
        cold: "cold",
        warm: "warm",
        hot: "hot",
        won: "won",
        lost_maybe_later: "lost - maybe later",
        lost_not_fit: "lost - not a fit",
      }[status];

      // Log activity for won conversions to track sales cycle
      if (status === "won" && contactToUpdate && user) {
        try {
          const { error } = await supabase.from("activities").insert({
            user_id: user.id,
            contact_id: contactId,
            type: "status_change",
            title: "Marked as Won - Sale Closed! 🎉",
            description: `${contactToUpdate.name} converted from ${contactToUpdate.status} to won. This contact can now be tracked for lifetime value and sales cycle analysis.`,
            completed_at: new Date().toISOString(),
          });

          if (error) {
            console.error("Error logging won conversion activity:", error);
          }
        } catch (error) {
          console.error("Error logging won conversion activity:", error);
        }
      }

      toast({
        title: "Status updated",
        description: `${contactToUpdate?.name} has been marked as ${statusLabel}.`,
      });
    } catch (error) {
      console.error("Error updating contact status:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update contact status";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateContactRelationship = async (
    contactId: string,
    relationshipType: Contact["relationshipType"]
  ) => {
    try {
      const contactToUpdate = contacts.find((c) => c.id === contactId);
      if (!contactToUpdate) return;

      const updatedContact = {
        ...contactToUpdate,
        relationshipType,
        // Smart coupling: booked_client should automatically set status to won
        status:
          relationshipType === "booked_client" ? "won" : contactToUpdate.status,
      };

      // Cache will be updated automatically by React Query after saveContact

      // Auto-set follow-up date if changing relationship and no current follow-up exists
      if (!updatedContact.nextFollowUp && crmSettings.auto_followup_enabled) {
        const autoFollowUp = computeNextFollowUp(updatedContact, crmSettings);
        if (autoFollowUp) {
          updatedContact.nextFollowUp = autoFollowUp;
          toast({
            title: "Auto follow-up scheduled",
            description: `Follow-up set for ${autoFollowUp.toLocaleDateString()}`,
          });
        }
      }

      // Persist to database
      await saveContact(updatedContact);

      toast({
        title: "Relationship updated",
        description: `${
          contactToUpdate.name
        }'s relationship has been updated to ${relationshipType.replace(
          "_",
          " "
        )}.`,
      });
    } catch (error) {
      console.error("Error updating contact relationship:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update relationship";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleToggleResponse = async (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    try {
      const updatedContact = {
        ...contact,
        responseReceived: !contact.responseReceived,
      };

      // Persist to database
      await saveContact(updatedContact);

      const status = !contact.responseReceived ? "responded" : "no response";
      toast({
        title: "Response status updated",
        description: `${contact?.name} marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error updating response status:", error);
      toast({
        title: "Error",
        description: "Failed to update response status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleArchive = async (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    try {
      const updatedContact = {
        ...contact,
        archived: !contact.archived,
      };

      // Persist to database
      await saveContact(updatedContact);

      const status = !contact.archived ? "archived" : "unarchived";
      toast({
        title: "Contact archived",
        description: `${contact?.name} has been ${status}.`,
      });
    } catch (error) {
      console.error("Error updating archive status:", error);
      toast({
        title: "Error",
        description: "Failed to update archive status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    if (user) {
      try {
        // Delete associated activities first
        const { error: activitiesError } = await supabase
          .from("activities")
          .delete()
          .eq("contact_id", contactId)
          .eq("user_id", user.id);

        if (activitiesError) throw activitiesError;

        // Delete the contact
        const { error: contactError } = await supabase
          .from("contacts")
          .delete()
          .eq("id", contactId)
          .eq("user_id", user.id);

        if (contactError) throw contactError;

        // React Query will automatically refresh the data
      } catch (error) {
        console.error("Error deleting contact:", error);
        toast({
          title: "Error",
          description: "Failed to delete contact. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    // React Query handles state updates automatically
  };

  // Bulk action handlers
  const handleBulkDeleteContacts = async (contactIds: string[]) => {
    if (!user) return;

    try {
      const { error: activitiesError } = await supabase
        .from("activities")
        .delete()
        .in("contact_id", contactIds)
        .eq("user_id", user.id);

      if (activitiesError) throw activitiesError;

      const { error: contactsError } = await supabase
        .from("contacts")
        .delete()
        .in("id", contactIds)
        .eq("user_id", user.id);

      if (contactsError) throw contactsError;

      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      toast({
        title: "Contacts Deleted",
        description: `Successfully deleted ${contactIds.length} contact(s) and their activities.`,
      });
    } catch (error) {
      console.error("Error bulk deleting contacts:", error);
      toast({
        title: "Error",
        description: "Failed to delete contacts. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkChangeCategory = async (
    contactIds: string[],
    category: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ category })
        .in("id", contactIds)
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast({
        title: "Category Updated",
        description: `Successfully updated category for ${contactIds.length} contact(s).`,
      });
    } catch (error) {
      console.error("Error bulk changing category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkDeleteActivities = async (contactIds: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .in("contact_id", contactIds)
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      toast({
        title: "Activities Deleted",
        description: `Successfully deleted activities for ${contactIds.length} contact(s).`,
      });
    } catch (error) {
      console.error("Error bulk deleting activities:", error);
      toast({
        title: "Error",
        description: "Failed to delete activities. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkChangeRelationship = async (
    contactIds: string[],
    relationshipType: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ relationship_type: relationshipType })
        .in("id", contactIds)
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast({
        title: "Relationship Updated",
        description: `Successfully updated relationship type for ${contactIds.length} contact(s).`,
      });
    } catch (error) {
      console.error("Error bulk changing relationship:", error);
      toast({
        title: "Error",
        description: "Failed to update relationship type. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleBulkChangeStatus = async (
    contactIds: string[],
    status: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ status })
        .in("id", contactIds)
        .eq("user_id", user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });

      toast({
        title: "Status Updated",
        description: `Successfully updated status for ${contactIds.length} contact(s).`,
      });
    } catch (error) {
      console.error("Error bulk changing status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!user) return;

    try {
      await deleteActivity(activityId);

      toast({
        title: "Activity deleted",
        description:
          "Activity has been permanently deleted and contact stats updated.",
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddActivity = async (
    contactId: string,
    payload: {
      type: TouchpointType;
      title: string;
      description?: string;
      responseReceived: boolean;
      when: Date;
      nextFollowUp?: Date;
    }
  ) => {
    try {
      const isScheduledForFuture = payload.when > new Date();
      const newActivityData = {
        contactId,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        responseReceived: payload.responseReceived,
        scheduledFor: isScheduledForFuture ? payload.when : undefined,
        createdAt: new Date(),
        completedAt: isScheduledForFuture ? undefined : payload.when,
      };
      await saveActivity(newActivityData);

      // Get contact for outreach activity logging
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        // Auto-complete daily tasks based on outreach activity
        let outreachType: "cold" | "warm" | "social" | null = null;

        // Determine outreach type based on contact relationship and activity type
        if (contact.relationshipType === "lead" && contact.status === "cold") {
          outreachType = "cold";
        } else if (
          contact.relationshipType === "lead" &&
          ["warm", "hot"].includes(contact.status)
        ) {
          outreachType = "warm";
        } else if (
          [
            "past_client",
            "friend_family",
            "associate_partner",
            "referral_source",
          ].includes(contact.relationshipType)
        ) {
          outreachType = "warm";
        } else if (payload.type === "linkedin" || payload.type === "social") {
          outreachType = "social";
        }

        // Log outreach activity and reconcile tasks if applicable
        if (outreachType && user?.id) {
          console.log("🎯 About to log outreach:", {
            outreachType,
            contact: contact.name,
          });
          const logged = await logOutreachActivity(
            outreachType,
            1,
            `${payload.title} - ${contact.name}`
          );
          console.log("📊 Outreach logged:", logged);
          if (logged) {
            console.log("🔄 Starting task reconciliation...");
            await reconcileOutreach();
            console.log("✅ Task reconciliation complete");
            // Add contact name to the completed task notes
            console.log("📝 Adding contact to task notes...");
            await addContactToTaskNotes(outreachType, contact.name);
            console.log("📝 Contact added to task notes");
          }
        }
      }

      toast({
        title: "Activity Added",
        description: `${payload.title} has been logged.`,
      });
    } catch (error) {
      console.error("Error adding activity:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Failed to add activity",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateActivity = async (updatedActivity: Activity) => {
    if (!user) return;

    try {
      // Update activity in database
      const { error } = await supabase
        .from("activities")
        .update({
          response_received: updatedActivity.responseReceived,
          type: updatedActivity.type,
          title: updatedActivity.title,
          description: updatedActivity.description,
          message_content: updatedActivity.messageContent || null,
          scheduled_for: updatedActivity.scheduledFor
            ? new Date(updatedActivity.scheduledFor).toISOString()
            : null,
          completed_at: updatedActivity.completedAt
            ? new Date(updatedActivity.completedAt).toISOString()
            : null,
        })
        .eq("id", updatedActivity.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Invalidate only CRM data cache to refresh the UI immediately
      await queryClient.invalidateQueries({
        queryKey: ["crmData", user.id],
        exact: true,
      });

      console.log("Activity updated successfully");

      toast({
        title: "Activity Updated",
        description: "Activity has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating activity:", error);
      toast({
        title: "Error",
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditActivity = (activity: Activity) => {
    const contact = contacts.find((c) => c.id === activity.contactId);
    if (contact) {
      activityDialog.openEditDialog(contact, activity);
    } else {
      toast({
        title: "Error",
        description: "Contact not found for this activity",
        variant: "destructive",
      });
    }
  };

  const handleImportContacts = async (
    importedContacts: Partial<Contact>[]
  ): Promise<{ contactIds: string[] }> => {
    if (!user) {
      console.error("❌ Import failed: User not authenticated");
      toast({
        title: "Authentication Required",
        description: "You must be signed in to import contacts",
        variant: "destructive",
      });
      return { contactIds: [] };
    }

    try {
      console.log(
        "🚀 Starting batch import of",
        importedContacts.length,
        "contacts for user:",
        user.id
      );
      console.log("📧 User email:", user.email);

      // Validate user session before proceeding
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("❌ Session validation failed:", sessionError);
        toast({
          title: "Session Expired",
          description: "Please sign in again to import contacts",
          variant: "destructive",
        });
        return { contactIds: [] };
      }

      // Prepare contacts for batch upsert - map from Contact interface to database schema
      const contactsToUpsert = importedContacts.map((contact) => ({
        name: (contact.name || "").trim() || "Unnamed Contact",
        email: contact.email?.trim().toLowerCase() || null,
        company: contact.company?.trim() || null,
        position: contact.position?.trim() || null,
        phone: contact.phone?.trim() || null,
        address: (contact as any).address?.trim() || null,
        city: (contact as any).city?.trim() || null,
        state: (contact as any).state?.trim() || null,
        zip_code: (contact as any).zip_code?.trim() || null,
        country: (contact as any).country?.trim() || null,
        linkedin_url: contact.linkedinUrl?.trim() || null,
        website_url: contact.websiteUrl?.trim() || null,
        social_media_links: (contact as any).social_media_links || {},
        status: contact.status || "cold",
        relationship_type: contact.relationshipType || "cold_lead",
        relationship_status: (contact as any).relationship_status || "cold",
        // CRITICAL: Derive intent from relationship type to prevent mismatches
        // This will be corrected by the admin tool if CSV has wrong intent
        relationship_intent:
          (contact as any).relationship_intent || "business_lead_statuses",
        category: contact.category || "uncategorized",
        source: contact.source?.trim() || "CSV Import",
        notes: contact.notes?.trim() || null,
        response_received: false,
        total_touchpoints: 0,
        booking_scheduled: false,
        archived: false,
        next_follow_up: contact.nextFollowUp
          ? new Date(contact.nextFollowUp).toISOString()
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        user_id: user.id,
      }));

      console.log(
        "📝 Prepared",
        contactsToUpsert.length,
        "contacts for upsert"
      );
      console.log("🔍 Sample contact data:", contactsToUpsert[0]);

      // Use batch upsert to handle conflicts gracefully
      const { data, error } = await supabase
        .from("contacts")
        .upsert(contactsToUpsert, { onConflict: "user_id,email,name" })
        .select("id");

      if (error) {
        console.error("❌ Batch import failed:", error);
        console.error("📋 Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Provide specific error messages based on error type
        let errorMessage = error.message;
        if (error.message.includes("row-level security policy")) {
          errorMessage =
            "Access denied: You don't have permission to import contacts. Please check your account status.";
        } else if (error.message.includes("duplicate key value")) {
          errorMessage =
            "Some contacts already exist in your database. Please remove duplicates and try again.";
        } else if (error.message.includes("violates not-null constraint")) {
          errorMessage =
            "Missing required data in some contacts. Please check that all contacts have names and emails.";
        } else if (error.code === "PGRST301") {
          errorMessage =
            "Database timeout. Try importing fewer contacts at once.";
        }

        toast({
          title: "Import Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { contactIds: [] };
      }

      const importedCount = data?.length || 0;
      const contactIds = data?.map((row) => row.id) || [];
      console.log("✅ Batch import successful:", importedCount, "contacts");

      if (importedCount === 0) {
        console.warn(
          "⚠️ No contacts were imported - possibly due to duplicates or validation issues"
        );
        toast({
          title: "No Contacts Imported",
          description:
            "No new contacts were added. This may be due to duplicates or validation issues.",
          variant: "destructive",
        });
        return { contactIds: [] };
      }

      if (importedCount < importedContacts.length) {
        console.warn(
          `⚠️ Only ${importedCount} of ${importedContacts.length} contacts were imported`
        );
        toast({
          title: "Partial Import",
          description: `Only ${importedCount} of ${importedContacts.length} contacts were imported. Some may have been duplicates.`,
        });
      } else {
        toast({
          title: "Import Successful",
          description: `Successfully imported all ${importedCount} contacts.`,
        });
      }

      // Invalidate React Query cache to refresh data immediately
      console.log("🔄 Invalidating React Query cache after import...");
      queryClient.invalidateQueries({ queryKey: ["crmData"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });

      return { contactIds };
    } catch (error) {
      console.error("❌ Import error:", error);

      let errorMessage = "An unexpected error occurred during import";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("💥 Error stack:", error.stack);
      }

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { contactIds: [] };
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const handleShowBookings = () => {
    setActiveTab("contacts");
  };

  // Helper function to safely extract date from potentially nested date structures
  const extractDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;

    // If it's already a Date object, return it
    if (dateValue instanceof Date) return dateValue;

    // If it's a string or number, try to parse it
    if (typeof dateValue === "string" || typeof dateValue === "number") {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }

    // If it's an object with date properties (e.g., from date picker)
    if (typeof dateValue === "object" && dateValue !== null) {
      // Try common date object properties
      if (dateValue.date) return extractDate(dateValue.date);
      if (dateValue.value) return extractDate(dateValue.value);
      if (dateValue.toDate && typeof dateValue.toDate === "function") {
        return dateValue.toDate();
      }
    }
    return undefined;
  };

  const handleDismissCoachBanner = () => {
    if (user) {
      localStorage.setItem(`coach-dismissed-${user.id}`, "true");
    }
    setShowCoachBanner(false);
  };

  // User is authenticated, render main app
  console.log(
    "[Index] Rendering main app - mode:",
    effectiveIsInIframe ? "embedded" : "standalone",
    "user:",
    user?.email || "none"
  );

  // Show public homepage for unauthenticated users (only shown if not redirected above)
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          {/* Debug sign out button for testing */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                console.log("[Debug] Force sign out clicked");
                await signOut();
                window.location.reload();
              }}
            >
              Force Sign Out
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-6">Welcome to PinkWizard CRM</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The Outbound Relationship Management System Built for Event
            Professionals
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/auth?tab=signin")}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      {/* max-w-7xl mx-auto */}
      <div
        className=" px-3 sm:px-4 md:px-6 lg:px-8 py-4 space-y-4"
        style={{ backgroundColor: "var(--appBg)" }}
      >
        {showCoachBanner && user && (
          <CoachBanner onDismiss={handleDismissCoachBanner} />
        )}

        {/* Main Content */}
        <div className="space-y-6 md:space-y-8">
          {activeTab === "dashboard" && (
            <DashboardLayout
              stats={stats}
              contacts={contacts}
              activities={activities}
              onShowBookings={handleShowBookings}
              externalCounts={getTodaysCounts()}
              isEmbeddedMode={isEmbeddedMode}
              onNavigateToAI={() => navigate("/ai-outreach")}
              onContactSelect={handleContactSelect}
              onAddContact={handleAddContact}
              onImportContacts={handleImportContacts}
              onUpdateContactStatus={handleUpdateContactStatus}
              onUpdateContactRelationship={handleUpdateContactRelationship}
              onToggleResponse={handleToggleResponse}
              onToggleArchive={handleToggleArchive}
              onDeleteContact={handleDeleteContact}
              onAddActivity={handleAddActivity}
              onLogTouchpoint={activityDialog.openDialog}
              onActivityUpdate={handleUpdateActivity}
              onActivityDelete={handleDeleteActivity}
              urlFilter={urlFilter}
              canWrite={canWrite}
              hasRealData={hasRealData}
              showDemoData={showDemoData}
              setShowDemoData={setShowDemoData}
              isChallengeParticipant={isChallengeParticipant}
            />
          )}

          {activeTab === "contacts" && (
            <ContactList
              contacts={contacts}
              activities={activities}
              onContactSelect={handleContactSelect}
              onAddContact={handleAddContact}
              onImportContacts={handleImportContacts}
              onUpdateContactStatus={handleUpdateContactStatus}
              onUpdateContactRelationship={handleUpdateContactRelationship}
              onToggleResponse={handleToggleResponse}
              onToggleArchive={handleToggleArchive}
              onDeleteContact={handleDeleteContact}
              onBulkDeleteContacts={handleBulkDeleteContacts}
              onBulkChangeCategory={handleBulkChangeCategory}
              onBulkChangeRelationship={handleBulkChangeRelationship}
              onBulkChangeStatus={handleBulkChangeStatus}
              onBulkDeleteActivities={handleBulkDeleteActivities}
              onDeleteActivity={handleDeleteActivity}
              onAddActivity={handleAddActivity}
              onLogTouchpoint={activityDialog.openDialog}
              urlFilter={urlFilter}
              disabled={!canWrite}
            />
          )}

          {activeTab === "activities" && (
            <div className="space-y-6">
              <Alert className="border-brand-coral bg-brand-coral/5 border-2">
                <Info className="h-4 w-4" />
                <AlertTitle>
                  Log touchpoints from the contact profile
                </AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    To keep things simple and accurate, log activities directly
                    on the contact from the Contacts tab. The Activities tab is
                    a read-only stream and analytics view.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("contacts")}
                    className="ml-4 shrink-0"
                  >
                    Go to Contacts
                  </Button>
                </AlertDescription>
              </Alert>
              <ActivitiesAnalyticsWidget />
              <ActivitiesTable
                activities={activities}
                contacts={contacts}
                onActivityUpdate={handleUpdateActivity}
                onActivityDelete={handleDeleteActivity}
                onRefresh={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["crmData", user.id],
                  });
                  toast({
                    title: "Refreshing...",
                    description: "Loading latest data",
                  });
                }}
              />
            </div>
          )}

          {activeTab === "tasks" && (
            <DailyTasks isChallengeParticipant={challengeParticipant} />
          )}

          {activeTab === "networking" && (
            <div className="space-y-6">
              <Alert className="bg-accent/20 border-accent/30">
                <Info className="h-4 w-4" />
                <AlertTitle>Networking Events</AlertTitle>
                <AlertDescription>
                  Log your networking events here and track any new contacts you
                  meet while engaging in networking activities. Each event helps
                  you build stronger professional relationships.
                </AlertDescription>
              </Alert>
              <NetworkingAnalyticsWidget />
              <NetworkingEvents />
            </div>
          )}

          {activeTab === "community" && (
            <div className="space-y-6">
              <CommunityFeed />
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactForm
        contact={selectedContact}
        isOpen={isContactFormOpen}
        onClose={() => {
          setIsContactFormOpen(false);
          setSelectedContact(null);
        }}
        onSave={handleSaveContact}
        activities={activities}
        onSaveActivity={handleAddActivity}
        onLogTouchpoint={activityDialog.openDialog}
        onEditActivity={handleEditActivity}
        onDeleteActivity={deleteActivity}
      />

      {/* Gamification Components */}
      <PointsToast />
      <RevenueDialog />
      <RewardNotifications />

      <WelcomeModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
      />

      {/* Centralized ActivityDialog */}
      <ActivityDialog
        open={activityDialog.isOpen}
        onOpenChange={(open) => !open && activityDialog.closeDialog()}
        contact={activityDialog.contact}
        onSave={activityDialog.saveTouchpoint}
        editingActivity={activityDialog.editingActivity}
      />
    </div>
  );
};

export default Index;
