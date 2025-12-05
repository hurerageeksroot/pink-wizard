import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckSquare,
  Eye,
  UserPlus,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useEnhancedRelationshipTypes } from "@/hooks/useEnhancedRelationshipTypes";

interface NetworkingEvent {
  id: string;
  event_name: string;
  event_type: string;
  location?: string;
  event_date: string;
  contacts_met_count: number;
  follow_ups_scheduled: number;
  challenge_day: number;
  outreach_points: number;
  notes?: string;
  created_at: string;
}

interface NetworkingEventContact {
  id: string;
  contact_id: string;
  notes?: string;
  follow_up_scheduled: boolean;
  follow_up_date?: string;
  contact?: {
    name: string;
    email: string;
    company?: string;
  };
}

interface QuickContact {
  name: string;
  email: string;
  company: string;
  position: string;
  notes: string;
  follow_up_scheduled: boolean;
  follow_up_date: string;
  relationship_type: string;
  category: string;
}

export const NetworkingEvents: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { relationshipTypes } = useEnhancedRelationshipTypes();
  const [events, setEvents] = useState<NetworkingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NetworkingEvent | null>(
    null
  );
  const [eventContacts, setEventContacts] = useState<NetworkingEventContact[]>(
    []
  );
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; email: string; company?: string }>
  >([]);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    event_name: "",
    event_type: "conference",
    location: "",
    event_date: "",
    notes: "",
  });
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contactForm, setContactForm] = useState({
    notes: "",
    follow_up_scheduled: false,
    follow_up_date: "",
  });

  // Quick contact form state for adding contacts during event creation
  const [quickContact, setQuickContact] = useState<QuickContact>({
    name: "",
    email: "",
    company: "",
    position: "",
    notes: "",
    follow_up_scheduled: false,
    follow_up_date: "",
    relationship_type: "cold_lead",
    category: "networking",
  });

  // List of contacts to be added when event is created
  const [newEventContacts, setNewEventContacts] = useState<QuickContact[]>([]);

  // Form state
  const [eventForm, setEventForm] = useState({
    event_name: "",
    event_type: "conference",
    location: "",
    event_date: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchContacts();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("networking_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching networking events:", error);
      toast({
        title: "Error",
        description: "Failed to load networking events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, company")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchEventContacts = async (eventId: string) => {
    if (!user) return;

    try {
      const { data: eventContactsData, error: eventContactsError } =
        await supabase
          .from("networking_event_contacts")
          .select("*")
          .eq("networking_event_id", eventId);

      if (eventContactsError) throw eventContactsError;

      // Get contact details for each event contact
      const eventContactsWithDetails = await Promise.all(
        (eventContactsData || []).map(async (eventContact) => {
          const { data: contactData, error: contactError } = await supabase
            .from("contacts")
            .select("name, email, company")
            .eq("id", eventContact.contact_id)
            .single();

          return {
            ...eventContact,
            contact: contactError ? null : contactData,
          };
        })
      );

      setEventContacts(eventContactsWithDetails);
    } catch (error) {
      console.error("Error fetching event contacts:", error);
    }
  };

  const getCurrentChallengeDay = async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc("get_current_challenge_day");
      if (error) throw error;
      return data || 1;
    } catch (error) {
      console.error("Error getting challenge day:", error);
      return 1;
    }
  };

  const addQuickContact = () => {
    if (!quickContact.name || !quickContact.email) return;

    // Check for duplicate emails
    if (
      newEventContacts.some((contact) => contact.email === quickContact.email)
    ) {
      toast({
        title: "Duplicate Contact",
        description: "A contact with this email is already added.",
        variant: "destructive",
      });
      return;
    }

    setNewEventContacts((prev) => [...prev, quickContact]);
    setQuickContact({
      name: "",
      email: "",
      company: "",
      position: "",
      notes: "",
      follow_up_scheduled: false,
      follow_up_date: "",
      relationship_type: "lead",
      category: "networking",
    });

    toast({
      title: "Contact Added",
      description: `${quickContact.name} will be added to this event.`,
    });
  };

  const removeQuickContact = (index: number) => {
    setNewEventContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic validation
    if (!eventForm.event_name.trim() || !eventForm.event_date.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the event name and date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const challengeDay = await getCurrentChallengeDay();

      const { data, error } = await supabase
        .from("networking_events")
        .insert({
          user_id: user.id,
          event_name: eventForm.event_name,
          event_type: eventForm.event_type,
          location: eventForm.location,
          event_date: eventForm.event_date,
          challenge_day: challengeDay,
          notes: eventForm.notes,
          contacts_met_count: 0,
          follow_ups_scheduled: 0,
          outreach_points: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Program tasks are now auto-completed via database trigger

      // Create contacts and associate them with the event
      await createEventContacts(data.id);

      setEvents((prev) => [data, ...prev]);
      setEventForm({
        event_name: "",
        event_type: "conference",
        location: "",
        event_date: "",
        notes: "",
      });
      setNewEventContacts([]);
      setIsAddEventOpen(false);

      toast({
        title: "Event Added",
        description: `${eventForm.event_name} has been logged successfully.`,
      });
    } catch (error) {
      console.error("Error adding networking event:", error);
      toast({
        title: "Error",
        description: "Failed to add networking event",
        variant: "destructive",
      });
    }
  };

  const createEventContacts = async (eventId: string) => {
    if (!user || newEventContacts.length === 0) return;

    try {
      let contactsCreated = 0;
      let followUpsScheduled = 0;

      for (const quickContact of newEventContacts) {
        // First create the contact in the contacts table
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            user_id: user.id,
            name: quickContact.name,
            email: quickContact.email,
            company: quickContact.company || null,
            position: quickContact.position || null,
            source: "networking_event",
            category: quickContact.category || "networking",
            relationship_type: quickContact.relationship_type || "cold_lead",
          })
          .select()
          .single();

        if (contactError) {
          console.error("Error creating contact:", contactError);
          continue; // Skip this contact but continue with others
        }

        // Then associate the contact with the networking event
        const { error: eventContactError } = await supabase
          .from("networking_event_contacts")
          .insert({
            networking_event_id: eventId,
            contact_id: newContact.id,
            notes: quickContact.notes || null,
            follow_up_scheduled: quickContact.follow_up_scheduled,
            follow_up_date: quickContact.follow_up_date || null,
          });

        if (eventContactError) {
          console.error(
            "Error associating contact with event:",
            eventContactError
          );
          continue;
        }

        contactsCreated++;
        if (quickContact.follow_up_scheduled) followUpsScheduled++;
      }

      // Update the event with the contact counts
      if (contactsCreated > 0) {
        const { error: updateError } = await supabase
          .from("networking_events")
          .update({
            contacts_met_count: contactsCreated,
            follow_ups_scheduled: followUpsScheduled,
          })
          .eq("id", eventId);

        if (updateError) {
          console.error("Error updating event stats:", updateError);
        }

        toast({
          title: "Contacts Added Successfully! 🎉",
          description: `${contactsCreated} contact${
            contactsCreated !== 1 ? "s" : ""
          } added to your event${
            followUpsScheduled > 0
              ? ` with ${followUpsScheduled} follow-up${
                  followUpsScheduled !== 1 ? "s" : ""
                } scheduled`
              : ""
          }.`,
        });

        // Refresh contacts list for future use
        fetchContacts();
      }
    } catch (error) {
      console.error("Error creating event contacts:", error);
      toast({
        title: "Error",
        description: "Some contacts could not be added to the event.",
        variant: "destructive",
      });
    }
  };

  const handleViewEvent = (event: NetworkingEvent) => {
    setSelectedEvent(event);
    fetchEventContacts(event.id);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;

    // Pre-fill the edit form with current event data
    setEditForm({
      event_name: selectedEvent.event_name,
      event_type: selectedEvent.event_type,
      location: selectedEvent.location || "",
      event_date: selectedEvent.event_date,
      notes: selectedEvent.notes || "",
    });
    setIsEditEventOpen(true);
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !user) return;

    // Basic validation
    if (!editForm.event_name.trim() || !editForm.event_date.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the event name and date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("networking_events")
        .update({
          event_name: editForm.event_name,
          event_type: editForm.event_type,
          location: editForm.location,
          event_date: editForm.event_date,
          notes: editForm.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEvent.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      const updatedEvent = {
        ...selectedEvent,
        event_name: editForm.event_name,
        event_type: editForm.event_type,
        location: editForm.location,
        event_date: editForm.event_date,
        notes: editForm.notes,
      };

      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedEvent.id ? updatedEvent : event
        )
      );
      setSelectedEvent(updatedEvent);
      setIsEditEventOpen(false);

      toast({
        title: "Event Updated",
        description: "Event details have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating networking event:", error);
      toast({
        title: "Error",
        description: "Failed to update networking event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !user) return;

    try {
      // First, delete all associated networking event contacts
      const { error: contactsDeleteError } = await supabase
        .from("networking_event_contacts")
        .delete()
        .eq("networking_event_id", selectedEvent.id);

      if (contactsDeleteError) throw contactsDeleteError;

      // Then delete the networking event itself
      const { error: eventDeleteError } = await supabase
        .from("networking_events")
        .delete()
        .eq("id", selectedEvent.id)
        .eq("user_id", user.id);

      if (eventDeleteError) throw eventDeleteError;

      // Update local state
      setEvents((prev) =>
        prev.filter((event) => event.id !== selectedEvent.id)
      );
      setSelectedEvent(null);
      setIsDeleteConfirmOpen(false);

      toast({
        title: "Event Deleted",
        description:
          "Event and all associated contacts have been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting networking event:", error);
      toast({
        title: "Error",
        description: "Failed to delete networking event",
        variant: "destructive",
      });
    }
  };

  const handleAddContactToEvent = async () => {
    if (!selectedEvent || !selectedContactId || !user) return;

    try {
      const { data, error } = await supabase
        .from("networking_event_contacts")
        .insert({
          networking_event_id: selectedEvent.id,
          contact_id: selectedContactId,
          notes: contactForm.notes,
          follow_up_scheduled: contactForm.follow_up_scheduled,
          follow_up_date: contactForm.follow_up_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update event stats
      const updatedContactsCount = selectedEvent.contacts_met_count + 1;
      const updatedFollowUpsCount =
        selectedEvent.follow_ups_scheduled +
        (contactForm.follow_up_scheduled ? 1 : 0);

      const { error: updateError } = await supabase
        .from("networking_events")
        .update({
          contacts_met_count: updatedContactsCount,
          follow_ups_scheduled: updatedFollowUpsCount,
        })
        .eq("id", selectedEvent.id);

      if (updateError) throw updateError;

      // Update local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                contacts_met_count: updatedContactsCount,
                follow_ups_scheduled: updatedFollowUpsCount,
              }
            : event
        )
      );

      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              contacts_met_count: updatedContactsCount,
              follow_ups_scheduled: updatedFollowUpsCount,
            }
          : null
      );

      // Refresh event contacts
      fetchEventContacts(selectedEvent.id);

      // Reset form
      setContactForm({
        notes: "",
        follow_up_scheduled: false,
        follow_up_date: "",
      });
      setSelectedContactId("");
      setIsAddContactOpen(false);

      toast({
        title: "Contact Added",
        description: "Contact has been associated with this event.",
      });
    } catch (error) {
      console.error("Error adding contact to event:", error);
      toast({
        title: "Error",
        description: "Failed to add contact to event",
        variant: "destructive",
      });
    }
  };

  const handleRemoveContactFromEvent = async (eventContactId: string) => {
    if (!selectedEvent || !user) return;

    try {
      const eventContact = eventContacts.find((ec) => ec.id === eventContactId);
      if (!eventContact) return;

      const { error } = await supabase
        .from("networking_event_contacts")
        .delete()
        .eq("id", eventContactId);

      if (error) throw error;

      // Update event stats
      const updatedContactsCount = Math.max(
        0,
        selectedEvent.contacts_met_count - 1
      );
      const updatedFollowUpsCount = Math.max(
        0,
        selectedEvent.follow_ups_scheduled -
          (eventContact.follow_up_scheduled ? 1 : 0)
      );

      const { error: updateError } = await supabase
        .from("networking_events")
        .update({
          contacts_met_count: updatedContactsCount,
          follow_ups_scheduled: updatedFollowUpsCount,
        })
        .eq("id", selectedEvent.id);

      if (updateError) throw updateError;

      // Update local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                contacts_met_count: updatedContactsCount,
                follow_ups_scheduled: updatedFollowUpsCount,
              }
            : event
        )
      );

      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              contacts_met_count: updatedContactsCount,
              follow_ups_scheduled: updatedFollowUpsCount,
            }
          : null
      );

      // Refresh event contacts
      fetchEventContacts(selectedEvent.id);

      toast({
        title: "Contact Removed",
        description: "Contact has been removed from this event.",
      });
    } catch (error) {
      console.error("Error removing contact from event:", error);
      toast({
        title: "Error",
        description: "Failed to remove contact from event",
        variant: "destructive",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      conference: "bg-primary/10 text-primary",
      meetup: "bg-secondary/10 text-secondary",
      workshop: "bg-accent/10 text-accent",
      general: "bg-muted/10 text-muted-foreground",
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Loading networking events...
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div
        className="space-y-6"
        style={{
          padding: "20px 25px",
          // backgroundColor: "#fff",
          // borderRadius: "10px",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Networking Events
            </h2>
            <p className="text-muted-foreground">
              Track your networking activities and follow-ups
            </p>
          </div>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Networking Event</DialogTitle>
                <DialogDescription>
                  Record details about your networking event and contacts you
                  met
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitEvent} className="space-y-6">
                {/* Event Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Event Details
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="event_name" className="font-medium">
                      Event Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="event_name"
                      value={eventForm.event_name}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          event_name: e.target.value,
                        }))
                      }
                      placeholder="Annual Tech Conference"
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_type">Event Type</Label>
                      <Select
                        value={eventForm.event_type}
                        onValueChange={(value) =>
                          setEventForm((prev) => ({
                            ...prev,
                            event_type: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="meetup">Meetup</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Venue"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_date" className="font-medium">
                      Event Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={eventForm.event_date}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          event_date: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Event Notes</Label>
                    <Textarea
                      id="notes"
                      value={eventForm.notes}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Key takeaways, important connections made..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Quick Add Contacts Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">
                      Contacts Met at Event
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {newEventContacts.length} contact
                      {newEventContacts.length !== 1 ? "s" : ""} added
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">💡 Quick Add Tip:</p>
                    <p>
                      Add contacts you met at this event. You can schedule
                      follow-ups for each contact, and we'll track them
                      automatically!
                    </p>
                    <p className="text-xs mt-1 font-medium text-primary">
                      This section is optional - you can log an event without
                      adding contacts.
                    </p>
                  </div>

                  {/* Quick Contact Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="quick_name">Contact Name</Label>
                      <Input
                        id="quick_name"
                        value={quickContact.name}
                        onChange={(e) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick_email">Email</Label>
                      <Input
                        id="quick_email"
                        type="text"
                        value={quickContact.email}
                        onChange={(e) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="john@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick_company">Company</Label>
                      <Input
                        id="quick_company"
                        value={quickContact.company}
                        onChange={(e) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            company: e.target.value,
                          }))
                        }
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick_position">Position</Label>
                      <Input
                        id="quick_position"
                        value={quickContact.position}
                        onChange={(e) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            position: e.target.value,
                          }))
                        }
                        placeholder="CEO, Manager, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick_relationship">
                        Relationship Type
                      </Label>
                      <Select
                        value={quickContact.relationship_type}
                        onValueChange={(value) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            relationship_type: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="quick_relationship"
                          className="bg-background"
                        >
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-background border shadow-lg">
                          {relationshipTypes.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick_category">Contact Category</Label>
                      <Select
                        value={quickContact.category}
                        onValueChange={(value) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="quick_category"
                          className="bg-background"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-background border shadow-lg">
                          <SelectItem value="networking">
                            Networking Contact
                          </SelectItem>
                          <SelectItem value="business">
                            Business Contact
                          </SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="vendor">
                            Vendor/Supplier
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="quick_notes">Meeting Notes</Label>
                      <Textarea
                        id="quick_notes"
                        value={quickContact.notes}
                        onChange={(e) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="What did you discuss? Key points to remember..."
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quick_follow_up"
                        checked={quickContact.follow_up_scheduled}
                        onCheckedChange={(checked) =>
                          setQuickContact((prev) => ({
                            ...prev,
                            follow_up_scheduled: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="quick_follow_up"
                        className="text-sm font-medium"
                      >
                        Schedule follow-up
                      </Label>
                    </div>
                    {quickContact.follow_up_scheduled && (
                      <div className="space-y-2">
                        <Label htmlFor="quick_follow_up_date">
                          Follow-up Date
                        </Label>
                        <Input
                          id="quick_follow_up_date"
                          type="date"
                          value={quickContact.follow_up_date}
                          onChange={(e) =>
                            setQuickContact((prev) => ({
                              ...prev,
                              follow_up_date: e.target.value,
                            }))
                          }
                          className="bg-background"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        onClick={addQuickContact}
                        variant="outline"
                        size="sm"
                        disabled={!quickContact.name || !quickContact.email}
                        className="w-full"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Contact to Event
                      </Button>
                    </div>
                  </div>

                  {/* Added Contacts List */}
                  {newEventContacts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Contacts to be added:
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {newEventContacts.map((contact, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-card border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {contact.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {contact.email} • {contact.company}
                              </p>
                              {contact.follow_up_scheduled && (
                                <p className="text-xs text-primary">
                                  📅 Follow-up: {contact.follow_up_date}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuickContact(index)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddEventOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !eventForm.event_name?.trim() ||
                      !eventForm.event_date?.trim()
                    }
                    className="min-w-[180px]"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Log Event & Contacts
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No networking events yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Start tracking your networking activities to build stronger
                professional relationships
              </p>
              <Button onClick={() => setIsAddEventOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Event
              </Button>
            </CardContent>
          </div>
        ) : (
          <div className="grid gap-4 auto-rows-max">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary/20"
                onClick={() => handleViewEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleViewEvent(event);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${event.event_name}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {event.event_name}
                        </h3>
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {event.event_type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(
                            new Date(event.event_date),
                            "MMM dd, yyyy at h:mm a"
                          )}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {event.contacts_met_count} contacts
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CheckSquare className="w-4 h-4" />
                          {event.follow_ups_scheduled} follow-ups
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {event.outreach_points} points earned
                        </div>
                      </div>

                      {event.notes && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Event Details Dialog */}
        <Dialog
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="flex items-center gap-3">
                        {selectedEvent.event_name}
                        <Badge
                          className={getEventTypeColor(
                            selectedEvent.event_type
                          )}
                        >
                          {selectedEvent.event_type}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {format(
                          new Date(selectedEvent.event_date),
                          "EEEE, MMMM dd, yyyy at h:mm a"
                        )}
                        {selectedEvent.location &&
                          ` • ${selectedEvent.location}`}
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditEvent}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDeleteConfirmOpen(true)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {selectedEvent.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedEvent.contacts_met_count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Contacts Met
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedEvent.follow_ups_scheduled}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Follow-ups
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedEvent.outreach_points}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Points Earned
                      </div>
                    </div>
                  </div>

                  {eventContacts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          Contacts from this Event
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => setIsAddContactOpen(true)}
                          disabled={contacts.length === 0}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {eventContacts.map((eventContact) => (
                          <div
                            key={eventContact.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {eventContact.contact?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div className="truncate">
                                  {eventContact.contact?.email}
                                </div>
                                {eventContact.contact?.company && (
                                  <div className="truncate text-xs">
                                    {eventContact.contact.company}
                                  </div>
                                )}
                              </div>
                              {eventContact.notes && (
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {eventContact.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {eventContact.follow_up_scheduled && (
                                <Badge variant="secondary" className="text-xs">
                                  Follow-up{" "}
                                  {eventContact.follow_up_date
                                    ? format(
                                        new Date(eventContact.follow_up_date),
                                        "MMM dd"
                                      )
                                    : "scheduled"}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveContactFromEvent(eventContact.id)
                                }
                                className="text-destructive hover:text-destructive p-1"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventContacts.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-medium mb-2">
                        No contacts added yet
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Associate contacts with this networking event to track
                        relationships and follow-ups
                      </p>
                      <Button
                        onClick={() => setIsAddContactOpen(true)}
                        disabled={contacts.length === 0}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First Contact
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Contact to Event Dialog */}
        <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Contact to Event</DialogTitle>
              <DialogDescription>
                Associate a contact with {selectedEvent?.event_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_select">Select Contact*</Label>
                <Select
                  value={selectedContactId}
                  onValueChange={setSelectedContactId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts
                      .filter(
                        (contact) =>
                          !eventContacts.some(
                            (ec) => ec.contact_id === contact.id
                          )
                      )
                      .map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} • {contact.email}
                          {contact.company && ` • ${contact.company}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {contacts.filter(
                  (contact) =>
                    !eventContacts.some((ec) => ec.contact_id === contact.id)
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All your contacts are already added to this event.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_notes">Meeting Notes</Label>
                <Textarea
                  id="contact_notes"
                  value={contactForm.notes}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="What did you discuss? Key takeaways from your conversation..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow_up_scheduled"
                  checked={contactForm.follow_up_scheduled}
                  onCheckedChange={(checked) =>
                    setContactForm((prev) => ({
                      ...prev,
                      follow_up_scheduled: checked === true,
                    }))
                  }
                />
                <Label htmlFor="follow_up_scheduled">Schedule follow-up</Label>
              </div>

              {contactForm.follow_up_scheduled && (
                <div className="space-y-2">
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={contactForm.follow_up_date}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        follow_up_date: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddContactOpen(false);
                    setContactForm({
                      notes: "",
                      follow_up_scheduled: false,
                      follow_up_date: "",
                    });
                    setSelectedContactId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddContactToEvent}
                  disabled={!selectedContactId}
                >
                  Add Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the details of your networking event
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_event_name" className="font-medium">
                  Event Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_event_name"
                  value={editForm.event_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      event_name: e.target.value,
                    }))
                  }
                  placeholder="Annual Tech Conference"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_event_type">Event Type</Label>
                  <Select
                    value={editForm.event_type}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, event_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_location">Location</Label>
                  <Input
                    id="edit_location"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Venue"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_event_date" className="font-medium">
                  Event Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_event_date"
                  type="datetime-local"
                  value={editForm.event_date}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      event_date: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Event Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Key takeaways, important connections made..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditEventOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !editForm.event_name?.trim() || !editForm.event_date?.trim()
                  }
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedEvent?.event_name}"?
                This will also remove all associated contacts from this event.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
