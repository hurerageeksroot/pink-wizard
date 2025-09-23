import { useState, useEffect } from "react";
import { Contact, Activity, LeadStatus, RelationshipType, ContactCategory, TouchpointType } from "@/types/crm";
import { useContactCategories } from "@/hooks/useContactCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Info, History, User, Plus, MessageCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ActivityDialog } from "@/components/ActivityDialog";
import { ContactRevenue } from "@/components/ContactRevenue";
import { ContactResearchPanel } from "@/components/ContactResearchPanel";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";

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
  const [activeTab, setActiveTab] = useState("details");
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
    relationshipType: "lead" as RelationshipType,
    category: "uncategorized" as ContactCategory,
    source: "",
    notes: "",
    nextFollowUp: undefined,
  });

  // Helper to determine if a relationship type should have lead status
  const shouldHaveLeadStatus = (relationshipType: RelationshipType) => {
    return relationshipType === 'lead' || relationshipType === 'lead_amplifier';
  };

  // Helper to get default status for relationship type
  const getDefaultStatus = (relationshipType: RelationshipType): LeadStatus => {
    if (relationshipType === 'booked_client') return 'won';
    if (shouldHaveLeadStatus(relationshipType)) return 'cold';
    return 'none';
  };

  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | undefined>(undefined);

  // Update form data when contact prop changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        email: contact.email || "",
        company: contact.company || "",
        position: contact.position || "",
        phone: contact.phone || "",
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        zip_code: contact.zip_code || "",
        country: contact.country || "",
        linkedinUrl: contact.linkedinUrl || "",
        websiteUrl: contact.websiteUrl || "",
        socialMediaLinks: {
          instagram: contact.socialMediaLinks?.instagram || "",
          twitter: contact.socialMediaLinks?.twitter || "",
          facebook: contact.socialMediaLinks?.facebook || "",
          tiktok: contact.socialMediaLinks?.tiktok || "",
        },
        status: contact.status || "cold",
        relationshipType: contact.relationshipType || "lead",
        category: contact.category || "uncategorized",
        source: contact.source || "",
        notes: contact.notes || "",
        nextFollowUp: contact.nextFollowUp || undefined,
      });
      setNextFollowUpDate(contact.nextFollowUp);
    } else {
      // Reset form for new contact
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
        relationshipType: "lead",
        category: "uncategorized",
        source: "",
        notes: "",
        nextFollowUp: undefined,
      });
      setNextFollowUpDate(undefined);
    }
  }, [contact]);

  // Helper to check if we have alternative contact info
  const hasAlternativeContactInfo = () => {
    const hasSocialMedia = Object.values(formData.socialMediaLinks).some(link => link.trim() !== "");
    return formData.company.trim() !== "" && (formData.linkedinUrl.trim() !== "" || hasSocialMedia);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on alternative contact info
    if (!hasAlternativeContactInfo()) {
      if (!formData.name.trim()) {
        alert("Name is required when company and LinkedIn/social media are not provided.");
        return;
      }
      if (!formData.email.trim()) {
        alert("Email is required when company and LinkedIn/social media are not provided.");
        return;
      }
    }

    const contactData = {
      id: contact?.id, // Include the ID when editing existing contact
      ...formData,
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
    
    onClose();
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

  // Helper functions for history tab
  const contactActivities = contact ? activities.filter(a => a.contactId === contact.id) : [];
  
  // Mock revenue data for now (in real app, this would come from activities or separate table)
  const contactRevenue = contactActivities
    .filter(a => a.title.toLowerCase().includes('revenue') || a.description?.toLowerCase().includes('revenue'))
    .map(a => ({
      id: a.id,
      amount: parseFloat(a.description?.match(/\$([0-9,]+)/)?.[1]?.replace(',', '') || '0'),
      type: a.title.includes('Referral') ? 'referral' as const : 'direct' as const,
      notes: a.description,
      date: new Date(a.completedAt || a.createdAt),
      referredClient: a.title.includes('Referral') ? a.description?.split('for client: ')?.[1] : undefined
    }));

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
      
      // Skip metrics deletion for now due to TypeScript issues
      // TODO: Implement proper metrics cleanup when TypeScript issues are resolved
      console.log('Skipping metrics deletion for revenue:', revenueId, 'amount:', amount);

      // Delete the activity directly

      // Delete the activity
      if (onDeleteActivity) {
        onDeleteActivity(revenueId);
      }
      
      // Recalculate and update contact's total revenue
      const { data: remainingRevenue } = await supabase
        .from('user_metrics')
        .select('value')
        .eq('user_id', user.id)
        .eq('metric_name', 'event_value')
        .eq('metric_type', 'currency')
        .eq('contact_id', contact.id);
      
      const newTotalRevenue = (remainingRevenue || []).reduce((sum, entry) => sum + (entry.value || 0), 0);
      
      // Update contact's revenue amount
      const { error: contactUpdateError } = await supabase
        .from('contacts')
        .update({ revenue_amount: newTotalRevenue })
        .eq('id', contact.id)
        .eq('user_id', user.id);
        
      if (contactUpdateError) {
        console.error('Error updating contact revenue:', contactUpdateError);
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-card border-border">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-card-foreground">
              {contact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className={`grid w-full mb-4 ${contact ? 'grid-cols-3' : 'grid-cols-1'}`}>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Details
              </TabsTrigger>
              {contact && (
                <>
                  <TabsTrigger value="research" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Research
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="details" className="overflow-y-auto max-h-[70vh] mt-0">
              <TooltipProvider delayDuration={300}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-end mb-4">
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
                      className="text-sm bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-900/30"
                    >
                      Generate AI Contact
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name">Name {!hasAlternativeContactInfo() ? '*' : ''}</Label>
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
                onChange={(e) => handleInputChange("name", e.target.value)}
                required={!hasAlternativeContactInfo()}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="email">Email {!hasAlternativeContactInfo() ? '*' : ''}</Label>
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
                onChange={(e) => handleInputChange("email", e.target.value)}
                required={!hasAlternativeContactInfo()}
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
                onChange={(e) => handleInputChange("company", e.target.value)}
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
                onChange={(e) => handleInputChange("position", e.target.value)}
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
                onChange={(e) => handleInputChange("phone", e.target.value)}
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
                      <TooltipContent side="top" className="z-[60] max-w-[350px]">
                        <div className="space-y-2 text-sm">
                          <p><strong>Lead - Client:</strong> Potential customer for your services</p>
                          <p><strong>Past Client:</strong> Someone who has hired you before</p>
                          <p><strong>Current Client:</strong> Someone who is currently working with you</p>
                          <p><strong>Colleague/Associate:</strong> Professional colleague or associate</p>
                          <p><strong>Referral Source:</strong> Someone who regularly sends you business</p>
                          <p><strong>Friend/Family:</strong> Personal connections in your network</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.relationshipType} onValueChange={(value: RelationshipType) => {
                    handleInputChange("relationshipType", value);
                    // Auto-set status based on relationship type
                    const newStatus = getDefaultStatus(value);
                    handleInputChange("status", newStatus);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Lead — Cold Outreach</div>
                      <SelectItem value="lead">Lead - Client</SelectItem>
                      <SelectItem value="lead_amplifier">Lead - Amplifier</SelectItem>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">Nurture — Warm Contact</div>
                      <SelectItem value="past_client">Past Client</SelectItem>
                      <SelectItem value="booked_client">Current Client</SelectItem>
                      <SelectItem value="associate_partner">Colleague/Associate</SelectItem>
                      <SelectItem value="referral_source">Referral Source</SelectItem>
                      <SelectItem value="friend_family">Friend/Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shouldHaveLeadStatus(formData.relationshipType) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="status">Lead Status</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[60] max-w-[300px]">
                          <div className="space-y-2 text-sm">
                            <p><strong>Cold:</strong> Don't know you exist + aren't ready to spend money to hire or refer you</p>
                            <p><strong>Warm:</strong> Know you exist but aren't currently ready to spend money to hire/refer you</p>
                            <p><strong>Hot:</strong> Know you exist and are ready to hire/refer you</p>
                            <p><strong>Won:</strong> Have hired you or referred business to you</p>
                            <p><strong>Lost - Maybe Later:</strong> Not ready now but might be in the future</p>
                            <p><strong>Lost - Not a Fit:</strong> Not a good match for your services</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={formData.status} onValueChange={(value: LeadStatus) => {
                      handleInputChange("status", value);
                      // Auto-set relationship type when won is selected
                      if (value === 'won') {
                        handleInputChange("relationshipType", 'booked_client');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="cold">Cold Lead</SelectItem>
                        <SelectItem value="warm">Warm Lead</SelectItem>
                        <SelectItem value="hot">Hot Lead</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost_maybe_later">Lost - Maybe Later</SelectItem>
                        <SelectItem value="lost_not_fit">Lost - Not a Fit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                  <Select value={formData.category} onValueChange={(value: ContactCategory) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={categories.length === 0 ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
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
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange("zip_code", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
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
              onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
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
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
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
                  onChange={(e) => handleInputChange("socialMediaLinks.instagram", e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"  
                  value={formData.socialMediaLinks.twitter}
                  onChange={(e) => handleInputChange("socialMediaLinks.twitter", e.target.value)}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialMediaLinks.facebook}
                  onChange={(e) => handleInputChange("socialMediaLinks.facebook", e.target.value)}
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={formData.socialMediaLinks.tiktok}
                  onChange={(e) => handleInputChange("socialMediaLinks.tiktok", e.target.value)}
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
              onChange={(e) => handleInputChange("source", e.target.value)}
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
              onChange={(e) => handleInputChange("notes", e.target.value)}
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
                <TabsContent value="research" className="overflow-y-auto max-h-[70vh] mt-0">
                  <ContactResearchPanel 
                    contactId={contact.id} 
                    contactName={contact.name} 
                  />
                </TabsContent>

                <TabsContent value="history" className="overflow-y-auto max-h-[70vh] mt-0 space-y-6">
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