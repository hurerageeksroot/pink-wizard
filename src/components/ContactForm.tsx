import { useState, useEffect, useRef, useCallback } from "react";
import { Contact, Activity, LeadStatus, RelationshipType, RelationshipIntent, ContactCategory, TouchpointType } from "@/types/crm";
import { useContactCategories } from "@/hooks/useContactCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Info, History, User, Plus, MessageCircle, Search, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ActivityDialog } from "@/components/ActivityDialog";
import { ContactRevenue } from "@/components/ContactRevenue";
import { ContactResearchPanel } from "@/components/ContactResearchPanel";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";
import { ContactContextTags } from "@/components/ContactContextTags";
import { useEnhancedRelationshipTypes, RELATIONSHIP_INTENT_CONFIGS } from '@/hooks/useEnhancedRelationshipTypes';
import { Skeleton } from "./ui/skeleton";
import { useContactRevenue } from "@/hooks/useContactRevenue";

interface ContactFormProps {
  contact?: Contact;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Partial<Contact>) => void;
  activities: Activity[];
  onSaveActivity: (contactId: string, payload: {
    type: TouchpointType;
    title: string;
    description?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => void;
  onLogTouchpoint?: (contact: Contact) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
}

export function ContactForm({ contact, isOpen, onClose, onSave, activities, onSaveActivity, onLogTouchpoint, onEditActivity, onDeleteActivity }: ContactFormProps) {
  const { categories } = useContactCategories();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openDialog: openRevenueDialog } = useRevenueDialog();
  const { getDefaultStatusForType, relationshipTypes, isLoading: relationshipTypesLoading, getStatusOptionsForType } = useEnhancedRelationshipTypes();
  const [activeTab, setActiveTab] = useState("details");
  
  // Track if user is actively editing to prevent form resets
  const isEditingRef = useRef(false);
  
  // Get the first relationship type as default, or fallback to 'cold_lead'
  const getDefaultRelationshipType = () => {
    if (relationshipTypes && relationshipTypes.length > 0) {
      return relationshipTypes[0].name;
    }
    return 'cold_lead';
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    linkedinUrl: "",
    websiteUrl: "",
    socialMediaLinks: {
      instagram: "",
      twitter: "",
      facebook: "",
      tiktok: "",
    },
    status: "none" as LeadStatus,
    relationshipType: getDefaultRelationshipType(),
    relationshipIntent: 'business_lead_statuses',
    relationshipStatus: getDefaultStatusForType(getDefaultRelationshipType()),
    category: "uncategorized" as ContactCategory,
    source: "",
    notes: "",
    nextFollowUp: undefined,
  });

  // Update relationship status when relationship type changes
  const handleRelationshipTypeChange = (newType: string) => {
    isEditingRef.current = true;
    
    // Get the intent for this relationship type
    const typeConfig = relationshipTypes?.find(rt => rt.name === newType);
    const newIntent = typeConfig?.relationshipIntent;
    
    // Get valid statuses for this intent
    const validStatuses = getStatusOptionsForType(newType);
    const validStatusKeys = Object.keys(validStatuses);
    
    // Check if current status is valid for the new type
    const currentStatus = formData.relationshipStatus;
    const isStatusValid = validStatusKeys.includes(currentStatus || '');
    
    // If current status is invalid, use the default status for the new type
    const newStatus = isStatusValid ? currentStatus : getDefaultStatusForType(newType);
    
    setFormData(prev => ({
      ...prev,
      relationshipType: newType,
      relationshipIntent: newIntent,
      relationshipStatus: newStatus
    }));
    
    // Show a toast if we had to change the status
    if (!isStatusValid && currentStatus) {
      toast({
        title: "Status Updated",
        description: `The status "${currentStatus}" is not valid for this relationship type. Changed to "${validStatuses[newStatus || '']?.label}".`,
        duration: 5000,
      });
    }
  };

  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | undefined>(undefined);

  // Auto-migrate contacts with invalid relationship types (from CSV imports, etc.)
  const migrateInvalidRelationshipType = useCallback(async (contact: Contact) => {
    // Skip if still loading relationship types
    if (relationshipTypesLoading || !relationshipTypes || relationshipTypes.length === 0) {
      return contact;
    }

    // Check if the contact's relationship type exists in user's config
    const typeExists = relationshipTypes.some(rt => rt.name === contact.relationshipType);
    
    if (!typeExists && contact.id) {
      console.warn('⚠️ Migrating invalid relationship type:', {
        contactId: contact.id,
        contactName: contact.name,
        oldType: contact.relationshipType,
        oldStatus: contact.relationshipStatus,
        oldIntent: contact.relationshipIntent
      });
      
      // Find a suitable replacement type
      // Priority: 1) match intent, 2) first available type
      let newType = relationshipTypes.find(rt => 
        rt.relationshipIntent === contact.relationshipIntent
      ) || relationshipTypes[0];
      
      if (newType) {
        const newStatus = getDefaultStatusForType(newType.name);
        
        // Update in database
        const { error } = await supabase
          .from('contacts')
          .update({
            relationship_type: newType.name,
            relationship_status: newStatus,
            relationship_intent: newType.relationshipIntent
          })
          .eq('id', contact.id);
        
        if (!error) {
          
          toast({
            title: "Contact Updated",
            description: `"${contact.name}" was updated to use your current relationship settings.`,
            duration: 4000,
          });
          
          return {
            ...contact,
            relationshipType: newType.name,
            relationshipStatus: newStatus,
            relationshipIntent: newType.relationshipIntent
          };
        } else {
          console.error('❌ Failed to migrate contact:', error);
        }
      }
    }
    
    return contact;
  }, [relationshipTypes, relationshipTypesLoading, getDefaultStatusForType, toast]);

  // Update form data when contact prop changes OR reset when dialog closes
  useEffect(() => {
    // Only guard against loading
    if (relationshipTypesLoading) {
      return;
    }

    if (contact && isOpen) {
      // CRITICAL: Don't reset form if user is actively editing
      // This prevents form resets when the contact object updates due to refetches
      if (isEditingRef.current) {
        return;
      }
      
      // Auto-migrate invalid relationship types BEFORE populating form
      const processContact = async () => {
        const migratedContact = await migrateInvalidRelationshipType(contact);
        
        // Set editing flag to prevent future resets
        isEditingRef.current = true;
        
        // Populate form with contact data (use migrated data)
        // Only validate if the status is truly missing or undefined (not just different)
        const hasStatus = migratedContact.relationshipStatus && migratedContact.relationshipStatus.trim() !== '';
        
        let finalStatus = migratedContact.relationshipStatus;
        
        // Only validate if status exists - preserve whatever is in the DB
        if (hasStatus && !relationshipTypesLoading) {
          const statusOptions = getStatusOptionsForType(migratedContact.relationshipType || 'lead');
          const validStatusKeys = Object.keys(statusOptions);
          
          // Only validate if we actually got status options back
          if (validStatusKeys.length > 0) {
            const isStatusValid = validStatusKeys.includes(migratedContact.relationshipStatus || '');
            
            // Only reset if truly invalid
            if (!isStatusValid) {
              finalStatus = getDefaultStatusForType(migratedContact.relationshipType || 'lead');
            }
          }
        } else if (!hasStatus) {
          // No status at all - use default
          finalStatus = getDefaultStatusForType(migratedContact.relationshipType || 'lead');
        }
        
        setFormData({
          name: migratedContact.name || "",
          email: migratedContact.email || "",
          company: migratedContact.company || "",
          position: migratedContact.position || "",
          phone: migratedContact.phone || "",
          address: migratedContact.address || "",
          city: migratedContact.city || "",
          state: migratedContact.state || "",
          zip_code: migratedContact.zip_code || "",
          country: migratedContact.country || "",
          linkedinUrl: migratedContact.linkedinUrl || "",
          websiteUrl: migratedContact.websiteUrl || "",
          socialMediaLinks: {
            instagram: migratedContact.socialMediaLinks?.instagram || "",
            twitter: migratedContact.socialMediaLinks?.twitter || "",
            facebook: migratedContact.socialMediaLinks?.facebook || "",
            tiktok: migratedContact.socialMediaLinks?.tiktok || "",
          },
          status: migratedContact.status || "cold",
          relationshipType: migratedContact.relationshipType || "lead",
          relationshipIntent: migratedContact.relationshipIntent || "business_lead_statuses",
          relationshipStatus: finalStatus,
          category: migratedContact.category || "uncategorized",
          source: migratedContact.source || "",
          notes: migratedContact.notes || "",
          nextFollowUp: migratedContact.nextFollowUp || undefined,
        });
        setNextFollowUpDate(migratedContact.nextFollowUp);
      };
      
      processContact();
    } else if (!contact && !isOpen) {
      // Reset form ONLY when dialog is closed AND no contact
      const defaultType = relationshipTypes && relationshipTypes.length > 0 
        ? relationshipTypes[0].name 
        : 'cold_lead';
      setFormData({
        name: "",
        email: "",
        company: "",
        position: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "",
        linkedinUrl: "",
        websiteUrl: "",
        socialMediaLinks: {
          instagram: "",
          twitter: "",
          facebook: "",
          tiktok: "",
        },
        status: "cold",
        relationshipType: defaultType,
        relationshipIntent: 'business_lead_statuses',
        relationshipStatus: getDefaultStatusForType(defaultType),
        category: "uncategorized",
        source: "",
        notes: "",
        nextFollowUp: undefined,
      });
      setNextFollowUpDate(undefined);
      isEditingRef.current = false;
    }
  }, [contact?.id, isOpen, relationshipTypesLoading, getDefaultStatusForType, getStatusOptionsForType]);

  // Reset editing flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      isEditingRef.current = false;
    }
  }, [isOpen]);

  // Helper to check if we have at least one valid contact method
  const hasAtLeastOneContactMethod = () => {
    // Email
    if (formData.email.trim() !== "") return true;
    
    // Phone
    if (formData.phone.trim() !== "") return true;
    
    // Physical address (at least one address field)
    if (formData.address.trim() !== "" || 
        formData.city.trim() !== "" || 
        formData.state.trim() !== "" || 
        formData.zip_code.trim() !== "") return true;
    
    // LinkedIn
    if (formData.linkedinUrl.trim() !== "") return true;
    
    // Website
    if (formData.websiteUrl.trim() !== "") return true;
    
    // Social media
    if (Object.values(formData.socialMediaLinks).some(link => link.trim() !== "")) return true;
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: Must have at least name AND one contact method
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a contact name",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasAtLeastOneContactMethod()) {
      toast({
        title: "Contact Information Required",
        description: "Please provide at least one contact method (email, phone, or LinkedIn)",
        variant: "destructive"
      });
      return;
    }

    if (!formData.relationshipStatus || formData.relationshipStatus === '') {
      // CRITICAL: Check if configs are still loading
      if (relationshipTypesLoading) {
        toast({
          title: "Please Wait",
          description: "Relationship settings are still loading. Please try again in a moment.",
          variant: "default",
        });
        return;
      }
      
      const currentType = relationshipTypes?.find(rt => rt.name === formData.relationshipType);
      toast({
        title: "Relationship Status Required",
        description: currentType 
          ? `Please select a status for "${currentType.label}"`
          : "Please select a relationship status",
        variant: "destructive"
      });
      
      const defaultStatus = getDefaultStatusForType(formData.relationshipType);
      if (defaultStatus) {
        handleInputChange('relationshipStatus', defaultStatus);
        toast({
          title: "Status Auto-Selected",
          description: "A default status has been selected. Please review and save again.",
        });
      }
      
      return;
    }

    // CRITICAL: Always derive intent from the relationship type config to prevent mismatches
    const typeConfig = relationshipTypes?.find(rt => rt.name === formData.relationshipType);
    const correctIntent = typeConfig?.relationshipIntent || formData.relationshipIntent;
    
    const contactData = {
      id: contact?.id, // Include the ID when editing existing contact
      ...formData,
      relationshipIntent: correctIntent as RelationshipIntent, // Use intent from type config
      nextFollowUp: nextFollowUpDate,
    };
    
    onSave(contactData);
    
    // Check if status is being set to "won" and open revenue dialog
    // Only open for existing contacts with valid IDs
    if (formData.status === 'won' && formData.name && contactData.id) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openRevenueDialogInternal', {
          detail: { contactName: formData.name, contactId: contactData.id }
        }));
      }, 100);
    }
    
    // Don't call onClose() here - let parent handle it after save completes
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialMediaLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMediaLinks: {
          ...prev.socialMediaLinks,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Wrapper that tracks user editing
  const handleInputChangeWithTracking = (field: string, value: string) => {
    isEditingRef.current = true;
    handleInputChange(field, value);
  };

  // Helper functions for history tab
  const contactActivities = contact ? activities.filter(a => a.contactId === contact.id) : [];
  
  // Fetch revenue data directly from user_metrics table
  const { data: contactRevenue = [], isLoading: isLoadingRevenue } = useContactRevenue(contact?.id);

  const handleEditActivity = (activity: Activity) => {
    if (onEditActivity) {
      onEditActivity(activity);
    }
  };

  const handleLogRevenue = () => {
    if (contact) {
      openRevenueDialog(contact.name, contact.id, contact.status);
    }
  };

  const handleEditRevenue = (revenueId: string) => {
    // Find the revenue activity to get the details for editing
    const revenueActivity = contactActivities.find(a => a.id === revenueId && a.type === 'revenue');
    if (revenueActivity && contact) {
      // Parse the revenue details from the activity
      const amountMatch = revenueActivity.title.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
      
      // Determine if it's referral revenue from the title
      const isReferral = revenueActivity.title.toLowerCase().includes('referral');
      
      // Extract referral client from description if it's a referral
      const referredClient = isReferral && revenueActivity.description 
        ? revenueActivity.description.match(/Referred client: (.+)/)?.[1] 
        : undefined;
      
      const currentRevenue = {
        id: revenueId,
        amount,
        notes: revenueActivity.description?.replace(/Referred client: .+/, '').trim(),
        revenueType: isReferral ? 'referral' as const : 'direct' as const,
        referredClient
      };
      
      openRevenueDialog(contact.name, contact.id, contact.status, currentRevenue);
    }
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    if (!user || !contact) return;
    
    try {
      // Find the revenue activity to get the amount
      const revenueActivity = contactActivities.find(a => a.id === revenueId && a.type === 'revenue');
      if (!revenueActivity) return;
      
      // Parse the revenue amount from the activity title (format: "Revenue: $X.XX")
      const amountMatch = revenueActivity.title.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
      
      // Delete the activity - CASCADE constraint will automatically delete associated metrics
      // The database trigger will automatically recalculate contacts.revenue_amount
      if (onDeleteActivity) {
        onDeleteActivity(revenueId);
      }
      
      toast({
        title: "Revenue Deleted",
        description: "Revenue record has been successfully deleted.",
      });
      
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast({
        title: "Error",
        description: "Failed to delete revenue. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] w-[95vw] sm:w-full max-h-[90vh] overflow-hidden bg-card border-border p-0">
          <DialogHeader className="border-b border-border pb-4 px-6 pt-6">
            <DialogTitle className="text-card-foreground">
              {contact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className="px-3 sm:px-6 pt-4">
              <TabsList className={`grid w-full mb-4 ${contact ? 'grid-cols-3' : 'grid-cols-1'}`}>
                <TabsTrigger value="details" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Details</span>
                  <span className="xs:hidden">📝</span>
                </TabsTrigger>
                {contact && (
                  <>
                    <TabsTrigger value="research" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Research</span>
                      <span className="xs:hidden">🔍</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <History className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">History</span>
                      <span className="xs:hidden">📜</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <TabsContent value="details" className="overflow-y-auto max-h-[70vh] mt-0 px-3 sm:px-6 pb-6">
              <TooltipProvider delayDuration={300}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (contact) {
                          // If editing existing contact, navigate to AI generator with contact info
                          navigate(`/ai-outreach?contactId=${contact.id}&channel=email&autostart=1`);
                        } else {
                          // If creating new contact, navigate to AI generator
                          navigate('/ai-outreach');
                        }
                      }}
                      className="w-full sm:w-auto text-sm bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-900/30 min-h-[44px]"
                    >
                      Generate AI Contact
                    </Button>

                    {/* Log Touchpoint button - only for existing contacts */}
                    {contact && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (contact && onLogTouchpoint) {
                            onLogTouchpoint(contact);
                          }
                        }}
                        className="w-full sm:w-auto text-sm flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Log Touchpoint
                      </Button>
                    )}

                    {/* Log Revenue button - only for existing contacts */}
                    {contact && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogRevenue}
                        className="w-full sm:w-auto text-sm flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <DollarSign className="w-4 h-4" />
                        Log Revenue
                      </Button>
                    )}
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name">Name *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Full name of the contact person</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChangeWithTracking("name", e.target.value)}
                required={true}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="email">Email</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Primary email address for outreach</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChangeWithTracking("email", e.target.value)}
                required={false}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="company">Company</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Company or organization they work for</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChangeWithTracking("company", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="position">Position</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Job title or role within their company</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChangeWithTracking("position", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Phone number for calls or text messages</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChangeWithTracking("phone", e.target.value)}
              />
            </div>

            {/* Lead Status, Relationship Type, and Category Section */}
            <div className="md:col-span-2 space-y-4 border-t border-border pt-4 bg-primary/5 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="text-foreground font-medium">Classification & Status</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Classify the contact's relationship and lead status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="relationshipType">Relationship Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[60] max-w-[200px]">
                        <p>Type of business relationship with this contact</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {relationshipTypesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={formData.relationshipType} 
                      onValueChange={(value) => {
                        handleRelationshipTypeChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
      <SelectContent className="bg-background border-border z-[60]">
        {/* Group relationship types by intent with proper headers */}
        <div className="space-y-1">
          {/* Business Lead Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'business_lead_statuses') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded">
                Business Lead
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'business_lead_statuses')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}

          {/* Business Nurture Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'business_nurture_statuses') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded mt-2">
                Business Nurture
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'business_nurture_statuses')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}

          {/* Personal Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'personal_statuses') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded mt-2">
                Personal
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'personal_statuses')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}

          {/* Civic & Community Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'civic_statuses') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded mt-2">
                Civic & Community
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'civic_statuses')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}

          {/* Service Provider/Vendor Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'vendor_statuses') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded mt-2">
                Service Provider/Vendor
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'vendor_statuses')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}

          {/* Other / Misc Group */}
          {relationshipTypes.some(type => type.relationshipIntent === 'other_misc') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded mt-2">
                Other / Misc
              </div>
              {relationshipTypes
                .filter(type => type.relationshipIntent === 'other_misc')
                .map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    <span className="text-sm">{type.label}</span>
                  </SelectItem>
                ))}
            </>
          )}
        </div>
      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="relationshipStatus">Relationship Status</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[60] max-w-[300px]">
                        <div className="space-y-2 text-sm">
                          <p>Current status of the relationship with this contact</p>
                          <p>Options vary based on the relationship type selected</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {relationshipTypesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={formData.relationshipStatus || getDefaultStatusForType(formData.relationshipType)} 
                      onValueChange={(newStatus) => {
                        isEditingRef.current = true;
                        handleInputChange("relationshipStatus", newStatus);
                        // Update legacy status field for backward compatibility based on relationship status
                        const statusMap: Record<string, LeadStatus> = {
                          'cold': 'cold',
                          'warm': 'warm', 
                          'hot': 'hot',
                          'won': 'won',
                          'lost_maybe_later': 'lost_maybe_later',
                          'lost_not_fit': 'lost_not_fit'
                        };
                        const legacyStatus = statusMap[newStatus] || 'none';
                        handleInputChange("status", legacyStatus);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border z-[60]">
                        {Object.entries(getStatusOptionsForType(formData.relationshipType)).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category">Contact Category</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[60] max-w-[200px]">
                        <p>Industry or role category for targeted outreach</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.category} onValueChange={(value: ContactCategory) => { isEditingRef.current = true; handleInputChange("category", value); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={categories.length === 0 ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-[60]">
                      {categories.length === 0 ? (
                        <SelectItem value="uncategorized" disabled>Loading categories...</SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Context Tags - Now available immediately for new contacts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Context Tags</Label>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[60] max-w-[250px]">
                          <p>Add custom tags to organize this contact. Create new tags in Settings → Tags.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {contact?.id ? (
                    <ContactContextTags
                      contactId={contact.id}
                      className="mt-2"
                      maxDisplay={3}
                      onChange={() => {
                        // Context tags are managed internally by the component
                        toast({
                          title: "Context updated",
                          description: "Contact context tags have been updated",
                        });
                      }}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-md">
                      Save contact to add context tags
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="md:col-span-2 space-y-4 border-t border-border pt-4 bg-muted/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="text-foreground font-medium">Address Information</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="z-[60] max-w-[200px]">
                    <p>Physical address for mail outreach and location tracking</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChangeWithTracking("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChangeWithTracking("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChangeWithTracking("state", e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChangeWithTracking("zip_code", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChangeWithTracking("country", e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Link to their LinkedIn profile for professional networking</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChangeWithTracking("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Company or personal website URL</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="websiteUrl"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChangeWithTracking("websiteUrl", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Label className="text-foreground font-medium">Social Media Links</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Social media profiles for content research and engagement</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialMediaLinks.instagram}
                  onChange={(e) => handleInputChangeWithTracking("socialMediaLinks.instagram", e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"  
                  value={formData.socialMediaLinks.twitter}
                  onChange={(e) => handleInputChangeWithTracking("socialMediaLinks.twitter", e.target.value)}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialMediaLinks.facebook}
                  onChange={(e) => handleInputChangeWithTracking("socialMediaLinks.facebook", e.target.value)}
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={formData.socialMediaLinks.tiktok}
                  onChange={(e) => handleInputChangeWithTracking("socialMediaLinks.tiktok", e.target.value)}
                  placeholder="https://tiktok.com/@username"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="source">Lead Source</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Where you first discovered or met this contact</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChangeWithTracking("source", e.target.value)}
              placeholder="e.g., LinkedIn, Website, Referral"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Next Follow-up Date</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Schedule when to follow up with this contact</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextFollowUpDate ? format(nextFollowUpDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextFollowUpDate}
                  onSelect={setNextFollowUpDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[60] max-w-[200px]">
                  <p>Additional context, meeting notes, or important details</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChangeWithTracking("notes", e.target.value)}
              placeholder="Add any additional notes about this contact..."
              rows={3}
            />
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 border-border hover:bg-muted"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md"
                    >
                      {contact ? "Update Contact" : "Add Contact"}
                    </Button>
                  </div>
                </form>
              </TooltipProvider>
            </TabsContent>

            {contact && (
              <>
                <TabsContent value="research" className="overflow-y-auto max-h-[70vh] mt-0 px-6 pb-6">
                  <ContactResearchPanel 
                    contactId={contact.id} 
                    contactName={contact.name} 
                  />
                </TabsContent>

                <TabsContent value="history" className="overflow-y-auto max-h-[70vh] mt-0 px-6 pb-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Contact History</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Close this dialog first, then open activity dialog
                        onClose();
                        // Slight delay to ensure smooth transition
                        setTimeout(() => {
                          if (contact && onLogTouchpoint) {
                            onLogTouchpoint(contact);
                          }
                        }, 100);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Log Touchpoint
                    </Button>
                  </div>
                </div>

                <ContactRevenue
                  contactId={contact.id}
                  contactName={contact.name}
                  revenue={contactRevenue}
                  onEditRevenue={handleEditRevenue}
                  onDeleteRevenue={handleDeleteRevenue}
                  onLogRevenue={handleLogRevenue}
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Activity Timeline</h3>
                  </div>
                  
                   <ActivityTimeline
                     activities={contactActivities}
                     contactId={contact.id}
                     onEditActivity={handleEditActivity}
                     onDeleteActivity={onDeleteActivity}
                   />
                </div>
              </TabsContent>
              </>
            )}
            </Tabs>
        </DialogContent>
      </Dialog>

    </>
  );
}