import { useState, useEffect, useRef, useMemo } from "react";
import Papa from "papaparse";
import { Contact, Activity, TouchpointType, LeadStatus, RelationshipType } from "@/types/crm";
import { StatusBadge } from "./StatusBadge";
import { ContactCategoryBadge } from "./ContactCategoryBadge";
import { EnhancedRelationshipBadge } from "./EnhancedRelationshipBadge";
import { EnhancedRelationshipStatusBadge } from "./EnhancedRelationshipStatusBadge";
import { ContactContextTags } from "./ContactContextTags";
import { DemoContactIndicator } from "./DemoContactIndicator";
import { ActivityDialog } from "./ActivityDialog";
import { ActivityTimeline } from "./ActivityTimeline";
import { ImportDialog } from "./ImportDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAccess } from "@/hooks/useAccess";
import { useAIQuota } from "@/hooks/useAIQuota";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  Clock,
  Users,
  History,
  Grid3X3,
  List,
  MoreHorizontal,
  Upload,
  Download,
  Linkedin,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Zap,
  Target,
  Trash2,
  Star,
  DollarSign,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContactCategories } from "@/hooks/useContactCategories";
import { useEnhancedRelationshipTypes } from "@/hooks/useEnhancedRelationshipTypes";
import { ContactRevenueDisplay } from "./ContactRevenueDisplay";

interface ContactListProps {
  contacts: Contact[];
  activities: Activity[];
  onContactSelect: (contact: Contact) => void;
  onAddContact: () => void;
  onImportContacts: (contacts: Partial<Contact>[]) => Promise<{ contactIds: string[] }>;
  onUpdateContactStatus: (contactId: string, status: Contact['status']) => void;
  onUpdateContactRelationship: (contactId: string, relationshipType: Contact['relationshipType']) => void;
  onToggleResponse: (contactId: string) => void;
  onToggleArchive: (contactId: string) => void;
  onDeleteContact: (contactId: string) => void;
  onBulkDeleteContacts?: (contactIds: string[]) => void;
  onBulkChangeCategory?: (contactIds: string[], category: string) => void;
  onBulkChangeRelationship?: (contactIds: string[], relationshipType: RelationshipType) => void;
  onBulkChangeStatus?: (contactIds: string[], status: LeadStatus) => void;
  onBulkDeleteActivities?: (contactIds: string[]) => void;
  onDeleteActivity?: (activityId: string) => void;
  onAddActivity: (contactId: string, payload: {
    type: TouchpointType;
    title: string;
    description?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => void;
  onLogTouchpoint: (contact: Contact) => void;
  disabled?: boolean;
  urlFilter?: string | null;
}

export function ContactList({ 
  contacts,
  activities,
  onContactSelect,
  onAddContact,
  onImportContacts,
  onUpdateContactStatus,
  onUpdateContactRelationship,
  onToggleResponse,
  onToggleArchive,
  onDeleteContact,
  onBulkDeleteContacts,
  onBulkChangeCategory,
  onBulkChangeRelationship,
  onBulkChangeStatus,
  onBulkDeleteActivities,
  onDeleteActivity,
  onAddActivity,
  onLogTouchpoint,
  disabled = false,
  urlFilter = null
}: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showArchived, setShowArchived] = useState(false);
  const [showInstagramOnly, setShowInstagramOnly] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContactForHistory, setSelectedContactForHistory] = useState<Contact | null>(null);
  const [selectedContactForDeletion, setSelectedContactForDeletion] = useState<Contact | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return localStorage.getItem('leadAmplifierBannerDismissed') === 'true';
  });
  
  // Bulk actions state
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'change-category' | 'change-relationship' | 'change-status' | 'delete-contacts' | 'delete-activities' | null>(null);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>('lead');
  const [newStatus, setNewStatus] = useState<LeadStatus>('none');
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Highlight state
  const [highlightedContact, setHighlightedContact] = useState<string | null>(null);
  
  const { canWrite } = useAccess();
  const { toast } = useToast();
  const { canMakeRequest, quota } = useAIQuota();
  const { categories } = useContactCategories();
  const { relationshipTypes } = useEnhancedRelationshipTypes();
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);
  
  // Helper function to determine if a contact is ready for outreach
  const isReadyForOutreach = (contact: Contact): boolean => {
    if (!contact.nextFollowUp) return false;
    const followUpDate = new Date(contact.nextFollowUp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUpDate.setHours(0, 0, 0, 0);
    return followUpDate <= today;
  };
  
  // Apply URL filter on mount if provided
  useEffect(() => {
    if (urlFilter) {
      const cleanFilter = urlFilter.toLowerCase().trim();
      if (cleanFilter === 'ready' || cleanFilter === 'ready-for-outreach') {
        setStatusFilter('ready');
      } else if (cleanFilter === 'cold') {
        setStatusFilter('cold');
      } else if (cleanFilter === 'warm') {
        setStatusFilter('warm');
      } else if (cleanFilter === 'hot') {
        setStatusFilter('hot');
      } else if (cleanFilter === 'won') {
        setStatusFilter('won');
      } else if (['lost_maybe_later', 'lost-maybe-later', 'maybe-later'].includes(cleanFilter)) {
        setStatusFilter('lost_maybe_later');
      } else if (['lost_not_fit', 'lost-not-fit', 'not-fit'].includes(cleanFilter)) {
        setStatusFilter('lost_not_fit');
      }
    }
  }, [urlFilter]);

  // Track if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || 
           statusFilter !== 'all' || 
           relationshipFilter !== 'all' || 
           categoryFilter !== 'all' ||
           showArchived === true ||
           showInstagramOnly === true;
  }, [searchTerm, statusFilter, relationshipFilter, categoryFilter, showArchived]);

  // Detect potentially miscategorized contacts
  const potentialMiscategorized = useMemo(() => {
    return contacts.filter(c => c.relationshipType === 'lead_amplifier');
  }, [contacts]);

  // Clear all filters function
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRelationshipFilter('all');
    setCategoryFilter('all');
    setShowArchived(false);
    setShowInstagramOnly(false);
    
    // Also clear URL filter parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('filter');
    window.history.replaceState({}, '', url.toString());
    
    console.log('[ContactList] All filters cleared');
    
    toast({
      title: "Filters Cleared",
      description: `Now showing all ${contacts.length} contacts`,
      duration: 2000,
    });
  };

  // Filter contacts based on search term and filters
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
        (contact.position && contact.position.toLowerCase().includes(searchLower)) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'ready') {
        filtered = filtered.filter(contact => isReadyForOutreach(contact));
      } else {
        filtered = filtered.filter(contact => contact.status === statusFilter);
      }
    }

    // Apply relationship filter
    if (relationshipFilter !== 'all') {
      filtered = filtered.filter(contact => contact.relationshipType === relationshipFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(contact => contact.category === categoryFilter);
    }

    // Apply archived filter
    if (showArchived) {
      filtered = filtered.filter(contact => contact.archived);
    } else {
      filtered = filtered.filter(contact => !contact.archived);
    }

    // Apply Instagram filter
    if (showInstagramOnly) {
      filtered = filtered.filter(c => 
        c.socialMediaLinks?.instagram && !c.email
      );
    }

    return filtered;
  }, [contacts, searchTerm, statusFilter, relationshipFilter, categoryFilter, showArchived, showInstagramOnly]);

  // Event handlers
  const handleLogTouchpoint = (contact: Contact) => {
    onLogTouchpoint(contact);
  };

  const handleViewHistory = (contact: Contact) => {
    setSelectedContactForHistory(contact);
    setHistoryDialogOpen(true);
  };

  const handleGenerateAI = (contact: Contact) => {
    const params = new URLSearchParams({
      contactId: contact.id,
      channel: 'email', // Default channel
      autostart: '0', // Don't auto-start generation
      returnTo: '/?tab=contacts' // Set return path
    });
    navigate(`/ai-outreach?${params.toString()}`);
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContactForDeletion(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContact = () => {
    if (selectedContactForDeletion) {
      onDeleteContact(selectedContactForDeletion.id);
      setHighlightedContact(selectedContactForDeletion.id);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setHighlightedContact(null);
        timeoutRef.current = null;
      }, 2000);
    }
    setDeleteDialogOpen(false);
    setSelectedContactForDeletion(null);
  };

  // Bulk action handlers
  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleBulkAction = (actionType: 'change-category' | 'change-relationship' | 'change-status' | 'delete-contacts' | 'delete-activities') => {
    setBulkActionType(actionType);
    setBulkActionDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    try {
      const actionCount = selectedContacts.length;
      
      if (bulkActionType === 'change-category' && newCategory && onBulkChangeCategory) {
        await onBulkChangeCategory(selectedContacts, newCategory);
      } else if (bulkActionType === 'change-relationship' && onBulkChangeRelationship) {
        await onBulkChangeRelationship(selectedContacts, newRelationshipType);
        
        // Enhanced success toast for relationship changes
        const typeName = relationshipTypes.find(t => t.name === newRelationshipType)?.label || newRelationshipType;
        toast({
          title: "✨ Bulk Update Complete!",
          description: `Successfully updated ${actionCount} contact${actionCount > 1 ? 's' : ''} to "${typeName}"`,
        });
      } else if (bulkActionType === 'change-status' && onBulkChangeStatus) {
        await onBulkChangeStatus(selectedContacts, newStatus);
      } else if (bulkActionType === 'delete-contacts' && onBulkDeleteContacts) {
        await onBulkDeleteContacts(selectedContacts);
      } else if (bulkActionType === 'delete-activities' && onBulkDeleteActivities) {
        await onBulkDeleteActivities(selectedContacts);
      }
      
      setSelectedContacts([]);
      setBulkActionDialogOpen(false);
      setNewCategory('');
      setNewRelationshipType('lead');
      setNewStatus('none');
      setBulkActionType(null);
    } catch (error) {
      console.error('Bulk action failed:', error);
      // Error toasts are handled by parent handlers
    }
  };

  const handleBulkEnrich = async () => {
    // Filter for contacts that have Instagram but no email
    const contactsToEnrich = selectedContacts
      .map(id => contacts.find(c => c.id === id))
      .filter((c): c is Contact => 
        c !== undefined && 
        !!c.socialMediaLinks?.instagram && 
        !c.email
      );
    
    if (contactsToEnrich.length === 0) {
      toast({
        title: "No Contacts to Enrich",
        description: "Selected contacts either don't have Instagram handles or already have emails.",
        variant: "destructive",
      });
      return;
    }

    // Estimate cost and tokens
    const estimatedTokensPerContact = 2000;
    const totalTokens = contactsToEnrich.length * estimatedTokensPerContact;
    const estimatedCost = (totalTokens / 1000) * 0.01; // Approximate $0.01 per 1k tokens

    // Check if user can afford this
    if (!canMakeRequest(estimatedTokensPerContact)) {
      toast({
        title: "Insufficient AI Quota",
        description: `You need approximately ${totalTokens.toLocaleString()} tokens to enrich ${contactsToEnrich.length} contacts. Current quota: ${quota?.remaining || 0}`,
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog with cost estimate
    const confirmed = window.confirm(
      `Enrich ${contactsToEnrich.length} Instagram contact${contactsToEnrich.length > 1 ? 's' : ''}?\n\n` +
      `Estimated tokens: ${totalTokens.toLocaleString()}\n` +
      `Estimated cost: ~$${estimatedCost.toFixed(2)}\n` +
      `Current quota: ${quota?.remaining?.toLocaleString() || 'Unknown'} tokens\n\n` +
      `This will scrape their Instagram profiles and extract contact information from their bios.`
    );

    if (!confirmed) return;

    setIsEnriching(true);
    let completed = 0;
    let failed = 0;

    toast({
      title: "Starting Enrichment",
      description: `Processing ${contactsToEnrich.length} contact${contactsToEnrich.length > 1 ? 's' : ''}...`,
    });

    for (const contact of contactsToEnrich) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No valid session');
        }

        const response = await supabase.functions.invoke('research-contact', {
          body: { contactId: contact.id },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          console.error(`Failed to enrich ${contact.name}:`, response.error);
          failed++;
        } else {
          completed++;
          console.log(`Successfully enriched ${contact.name}`);
        }

        // Show progress toast every 5 contacts or on last contact
        if (completed % 5 === 0 || completed + failed === contactsToEnrich.length) {
          toast({
            title: `Enriching... (${completed + failed}/${contactsToEnrich.length})`,
            description: `✓ ${completed} completed${failed > 0 ? `, ✗ ${failed} failed` : ''}`,
          });
        }

        // Rate limiting: wait 2 seconds between requests to avoid overwhelming services
        if (completed + failed < contactsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error enriching contact ${contact.name}:`, error);
        failed++;
      }
    }

    setIsEnriching(false);
    setSelectedContacts([]); // Clear selection after completion

    // Final summary toast
    toast({
      title: "Enrichment Complete",
      description: `✓ ${completed} contact${completed !== 1 ? 's' : ''} enriched successfully${failed > 0 ? `, ✗ ${failed} failed` : ''}. Check the contact research panels for extracted information.`,
      duration: 5000,
    });
  };

  // Export functionality
  const handleExport = (exportAll: boolean = false) => {
    const contactsToExport = exportAll ? contacts : filteredContacts;
    
    if (contactsToExport.length === 0) {
      toast({
        title: "No contacts to export",
        description: "Please add some contacts first or adjust your filters.",
        variant: "destructive",
      });
      return;
    }

    const csvData = contactsToExport.map(contact => ({
      Name: contact.name,
      Email: contact.email,
      Company: contact.company || '',
      Position: contact.position || '',
      Phone: contact.phone || '',
      Status: contact.status,
      'Relationship Type': contact.relationshipType,
      Category: contact.category,
      'Total Touchpoints': contact.totalTouchpoints || 0,
      'Response Received': contact.responseReceived ? 'Yes' : 'No',
      'Next Follow Up': contact.nextFollowUp ? new Date(contact.nextFollowUp).toLocaleDateString() : '',
      'Last Contact': contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : '',
      'Revenue Amount': contact.revenueAmount || 0,
      Notes: contact.notes || '',
      'LinkedIn URL': contact.linkedinUrl || '',
      'Website URL': contact.websiteUrl || '',
      Source: contact.source || '',
      'Created Date': new Date(contact.createdAt).toLocaleDateString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const filename = exportAll 
      ? `all-contacts-${new Date().toISOString().split('T')[0]}.csv`
      : `shown-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful! ✨",
      description: `${contactsToExport.length} contacts exported perfectly.`,
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Active Filter Warning Banner */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-700">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Active Filters
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Showing {filteredContacts.length} of {contacts.length} contacts
                {filteredContacts.length < contacts.length && (
                  <span className="font-medium"> • {contacts.length - filteredContacts.length} hidden</span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="border-amber-300 hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900/40 flex-shrink-0"
            >
              Clear All
            </Button>
          </div>
        )}

      {/* Relationship Type Recovery Banner */}
      {potentialMiscategorized.length > 0 && !bannerDismissed && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertTitle>Contact Review Needed</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Found {potentialMiscategorized.length} contacts labeled as "Lead - Amplifier". 
                If any were previously "Past Client", you can re-categorize them below.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRelationshipFilter('lead_amplifier');
                    setSelectedContacts([]);
                  }}
                  className="border-blue-300 hover:bg-blue-100"
                >
                  Show These Contacts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRelationshipFilter('lead_amplifier');
                    handleSelectAll();
                  }}
                  className="border-blue-300 hover:bg-blue-100"
                >
              Select All & Change Type
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.setItem('leadAmplifierBannerDismissed', 'true');
                setBannerDismissed(true);
                toast({
                  title: "Banner Dismissed",
                  description: "You can clear your browser data to re-enable this banner.",
                });
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <X className="w-4 h-4 mr-1" />
              Don't show again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )}
        
        {/* Header with search and filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 items-center flex-1">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10">
                    <ChevronsUpDown className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border shadow-lg z-50 w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Quick Filters</div>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('all');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'all' && relationshipFilter === 'all' ? 'bg-accent' : ''}
                  >
                    All Contacts
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('ready');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'ready' ? 'bg-accent' : ''}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Ready for Outreach
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Lead Status</div>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('cold');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'cold' ? 'bg-accent' : ''}
                  >
                    Cold
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('warm');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'warm' ? 'bg-accent' : ''}
                  >
                    Warm
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('hot');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'hot' ? 'bg-accent' : ''}
                  >
                    Hot
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setStatusFilter('won');
                      setRelationshipFilter('all');
                    }}
                    className={statusFilter === 'won' ? 'bg-accent' : ''}
                  >
                    Won
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Relationship</div>
                  {relationshipTypes.map((type) => (
                    <DropdownMenuItem 
                      key={type.name}
                      onClick={() => {
                        setRelationshipFilter(type.name);
                        setStatusFilter('all');
                      }}
                      className={relationshipFilter === type.name ? 'bg-accent' : ''}
                    >
                      {type.label}
                    </DropdownMenuItem>
                  ))}
                  {potentialMiscategorized.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        🔍 Review Needed
                      </div>
                      <DropdownMenuItem 
                        onClick={() => {
                          setRelationshipFilter('lead_amplifier');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                        }}
                      >
                        <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                        Lead Amplifier Contacts ({potentialMiscategorized.length})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ready for Outreach Button */}
              <Button 
                variant={statusFilter === 'ready' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (statusFilter === 'ready') {
                    setStatusFilter('all');
                  } else {
                    setStatusFilter('ready');
                    setRelationshipFilter('all');
                  }
                }}
                className={statusFilter === 'ready' ? 'bg-primary text-primary-foreground' : 'border-orange-200 hover:bg-orange-50 text-orange-700'}
              >
                <Target className="w-4 h-4 mr-2" />
                Ready
              </Button>

              {/* Instagram Contacts Filter */}
              <Button 
                variant={showInstagramOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowInstagramOnly(!showInstagramOnly)}
                className={showInstagramOnly ? 'bg-primary text-primary-foreground' : 'border-purple-200 hover:bg-purple-50 text-purple-700'}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Instagram ({contacts.filter(c => c.socialMediaLinks?.instagram && !c.email).length})
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap items-center">
              {/* Import Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                disabled={!canWrite || disabled}
                className="border-primary/20 hover:bg-primary/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              
              {/* Export Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={disabled}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => handleExport(false)}>
                    Export Shown ({filteredContacts.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport(true)}>
                    Export All ({contacts.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                onClick={onAddContact} 
                disabled={!canWrite || disabled}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedContacts.length > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-base px-3 py-1.5">
                    {selectedContacts.length} Selected
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedContacts([])}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('change-category')}
                    disabled={!canWrite}
                  >
                    Change Category
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('change-relationship')}
                    disabled={!canWrite}
                  >
                    Change Relationship
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('change-status')}
                    disabled={!canWrite}
                  >
                    Change Status
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('delete-activities')}
                    disabled={!canWrite}
                  >
                    Delete Activities
                  </Button>
                  {selectedContacts.some(id => {
                    const contact = contacts.find(c => c.id === id);
                    return contact?.socialMediaLinks?.instagram && !contact.email;
                  }) && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleBulkEnrich}
                      disabled={!canWrite || isEnriching || disabled}
                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <Zap className="w-4 h-4" />
                      {isEnriching ? 'Enriching...' : 'Enrich Selected'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete-contacts')}
                    disabled={!canWrite}
                  >
                    Delete Contacts
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* View Toggle and Archive Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                  Select all shown
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                Show Archived
              </label>
              <Button
                variant={showInstagramOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInstagramOnly(!showInstagramOnly)}
                className="gap-2"
              >
                <Instagram className="w-4 h-4" />
                Instagram ({contacts.filter(c => c.socialMediaLinks?.instagram && !c.email).length})
              </Button>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </p>
                {hasActiveFilters && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {searchTerm && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Status: {statusFilter}
                      </Badge>
                    )}
                    {relationshipFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Relationship: {relationshipFilter}
                      </Badge>
                    )}
                    {categoryFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Category: {categoryFilter}
                      </Badge>
                    )}
                    {showArchived && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Archived Only
                      </Badge>
                    )}
                    {showInstagramOnly && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                        Instagram Only
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Display */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => {
              const readyForOutreach = isReadyForOutreach(contact);
              const isSelected = selectedContacts.includes(contact.id);
              const isHighlighted = highlightedContact === contact.id;
              
              return (
                <Card 
                  key={contact.id} 
                  className={cn(
                    "relative transition-all duration-200 hover:shadow-lg cursor-pointer",
                    isSelected && "ring-2 ring-primary bg-primary/5",
                    isHighlighted && "opacity-30"
                  )}
                  onClick={(e) => {
                    onContactSelect(contact);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base font-semibold truncate">
                                {contact.name}
                              </CardTitle>
                              <DemoContactIndicator contact={contact} />
                              {contact.socialMediaLinks?.instagram && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={`https://www.instagram.com/${contact.socialMediaLinks.instagram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-500 hover:text-purple-600"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Instagram className="w-4 h-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    @{contact.socialMediaLinks.instagram}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {contact.linkedinUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={contact.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Linkedin className="w-4 h-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    View LinkedIn Profile
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                            {contact.company && (
                              <p className="text-sm text-muted-foreground truncate mt-1">{contact.company}</p>
                            )}
                            {contact.position && (
                              <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectContact(contact.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge status={contact.status} />
                        <EnhancedRelationshipBadge
                          relationshipType={contact.relationshipType}
                          disabled
                          className="text-xs"
                        />
                        {contact.relationshipStatus && (
                          <EnhancedRelationshipStatusBadge
                            relationshipType={contact.relationshipType}
                            relationshipStatus={contact.relationshipStatus}
                            disabled
                            className="text-xs"
                          />
                        )}
                        <ContactContextTags
                          contactId={contact.id}
                          preloadedContexts={contact.contexts}
                          maxDisplay={2}
                          disabled
                        />
                        <ContactCategoryBadge category={contact.category} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Touchpoints:</span>
                         <Badge variant="secondary" className="text-xs">
                           {activities.filter(a => a.contactId === contact.id).length}
                         </Badge>
                      </div>

                      <ContactRevenueDisplay contactId={contact.id} />

                      <div className="flex flex-wrap gap-1 pt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLogTouchpoint(contact);
                              }}
                              className="flex-1 text-xs border-primary text-primary hover:bg-primary/10 hover:text-primary active:text-primary focus-visible:ring-primary"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Log
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Log touchpoint</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(contact);
                              }}
                              className="flex-1 text-xs border-primary text-primary hover:bg-primary/10 hover:text-primary active:text-primary focus-visible:ring-primary"
                            >
                              <History className="w-3 h-3 mr-1" />
                              History
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View activity history</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateAI(contact);
                              }}
                              className="flex-1 text-xs border-primary text-primary hover:bg-primary/10 hover:text-primary active:text-primary focus-visible:ring-primary"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              AI
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Generate AI outreach</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('openRevenueDialogInternal', {
                                  detail: { contactName: contact.name, contactId: contact.id, contactStatus: contact.status }
                                }));
                              }}
                              disabled={!canWrite}
                              className="flex-1 text-xs border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 active:text-green-700 focus-visible:ring-green-600"
                            >
                              <DollarSign className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Log revenue</TooltipContent>
                        </Tooltip>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="bg-background border shadow-lg z-50">
                          {contact.phone && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${contact.phone}`, '_self');
                            }}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${contact.email}`, '_blank');
                          }}>
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          {contact.linkedinUrl && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(contact.linkedinUrl, '_blank');
                            }}>
                              <Linkedin className="w-4 h-4 mr-2" />
                              LinkedIn
                            </DropdownMenuItem>
                          )}
                          {contact.socialMediaLinks?.instagram && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.instagram.com/${contact.socialMediaLinks.instagram.replace('@', '')}`, '_blank');
                            }}>
                              <Instagram className="w-4 h-4 mr-2" />
                              Instagram
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleArchive(contact.id);
                            }}
                            className="text-muted-foreground"
                          >
                            {contact.archived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Follow-up indicator */}
                      {contact.nextFollowUp && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-xs sm:text-sm">Follow up: {new Date(contact.nextFollowUp).toLocaleDateString()}</span>
                          </div>
                          {readyForOutreach && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-orange-600 font-medium">Ready for outreach!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Next Follow Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead className="w-16">Revenue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Touchpoints</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => {
                  const readyForOutreach = isReadyForOutreach(contact);
                  const isSelected = selectedContacts.includes(contact.id);
                  const isHighlighted = highlightedContact === contact.id;
                  
                  return (
                    <TableRow 
                      key={contact.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        isSelected ? 'bg-primary/5' : ''
                      } ${isHighlighted ? 'opacity-30' : ''}`}
                      onClick={() => onContactSelect(contact)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectContact(contact.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                          </div>
                          <DemoContactIndicator contact={contact} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contact.company || '-'}</div>
                          {contact.position && (
                            <div className="text-sm text-muted-foreground">{contact.position}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {contact.nextFollowUp ? (
                            <div className="text-sm">
                              {new Date(contact.nextFollowUp).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {readyForOutreach && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-orange-600 font-medium">Ready!</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={contact.status} />
                      </TableCell>
                      <TableCell>
                        <EnhancedRelationshipBadge
                          relationshipType={contact.relationshipType}
                          disabled
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ContactRevenueDisplay contactId={contact.id} />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.dispatchEvent(new CustomEvent('openRevenueDialogInternal', {
                                    detail: { contactName: contact.name, contactId: contact.id, contactStatus: contact.status }
                                  }));
                                }}
                                disabled={!canWrite}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Log revenue</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ContactCategoryBadge category={contact.category} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {contact.totalTouchpoints || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLogTouchpoint(contact);
                                }}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Log touchpoint</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewHistory(contact);
                                }}
                              >
                                <History className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View history</TooltipContent>
                          </Tooltip>


                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="bg-background border shadow-lg z-50">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateAI(contact);
                              }}>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate AI Content
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {contact.phone && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${contact.phone}`, '_self');
                                }}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                window.open(`mailto:${contact.email}`, '_blank');
                              }}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </DropdownMenuItem>
                              {contact.linkedinUrl && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(contact.linkedinUrl, '_blank');
                                }}>
                                  <Linkedin className="w-4 h-4 mr-2" />
                                  LinkedIn
                                </DropdownMenuItem>
                              )}
                              {contact.socialMediaLinks?.instagram && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://www.instagram.com/${contact.socialMediaLinks.instagram.replace('@', '')}`, '_blank');
                                }}>
                                  <Instagram className="w-4 h-4 mr-2" />
                                  Instagram
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleArchive(contact.id);
                                }}
                                className="text-muted-foreground"
                              >
                                {contact.archived ? 'Unarchive' : 'Archive'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContact(contact);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || statusFilter !== 'all' || relationshipFilter !== 'all' || categoryFilter !== 'all' 
                      ? 'No contacts match your filters' 
                      : 'No contacts yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || relationshipFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters to find contacts.'
                      : 'Start building your network by adding your first contact.'}
                  </p>
                  {(!searchTerm && statusFilter === 'all' && relationshipFilter === 'all' && categoryFilter === 'all') && (
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={onAddContact}
                        disabled={!canWrite || disabled}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Contact
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setImportDialogOpen(true)}
                        disabled={!canWrite || disabled}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Contacts
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Dialog */}
        <ImportDialog
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={onImportContacts}
          existingEmails={contacts.map(c => c.email)}
        />

        {/* Activity History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Activity History - {selectedContactForHistory?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedContactForHistory && (
              <ActivityTimeline
                activities={activities}
                contactId={selectedContactForHistory.id}
                onDeleteActivity={onDeleteActivity}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete {selectedContactForDeletion?.name}? 
                This action cannot be undone and will remove all associated activities and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteContact}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkActionType === 'change-category' && 'Change Category'}
                {bulkActionType === 'change-relationship' && 'Change Relationship Type'}
                {bulkActionType === 'change-status' && 'Change Status'}
                {bulkActionType === 'delete-contacts' && 'Delete Contacts'}
                {bulkActionType === 'delete-activities' && 'Delete Activities'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkActionType === 'change-category' && (
                  <div className="space-y-4">
                    <p className="font-medium">
                      Change category for {selectedContacts.length} selected contact(s)?
                    </p>
                    
                    {/* Preview section */}
                    <div className="rounded-md border p-3 bg-muted/30">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">
                        Preview (showing first 5):
                      </p>
                      <div className="space-y-1">
                        {filteredContacts
                          .filter(c => selectedContacts.includes(c.id))
                          .slice(0, 5)
                          .map(contact => (
                            <div key={contact.id} className="text-sm flex items-center gap-2">
                              <span className="flex-1 truncate">{contact.name}</span>
                              <ContactCategoryBadge category={contact.category} />
                            </div>
                          ))}
                        {selectedContacts.length > 5 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ...and {selectedContacts.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Category:</label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px] overflow-y-auto">
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Impact summary */}
                    {newCategory && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3">
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          <strong>{selectedContacts.length}</strong> contact{selectedContacts.length > 1 ? 's' : ''} will be changed to{' '}
                          <strong>{categories.find(c => c.name === newCategory)?.label || newCategory}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {bulkActionType === 'change-relationship' && (
                  <div className="space-y-4">
                    <p className="font-medium">
                      Change relationship type for {selectedContacts.length} selected contact(s)?
                    </p>
                    
                    {/* Preview of affected contacts */}
                    <div className="rounded-md border p-3 bg-muted/30">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">
                        Preview (showing first 5):
                      </p>
                      <div className="space-y-1">
                        {filteredContacts
                          .filter(c => selectedContacts.includes(c.id))
                          .slice(0, 5)
                          .map(contact => (
                            <div key={contact.id} className="text-sm flex items-center gap-2">
                              <span className="flex-1 truncate">{contact.name}</span>
                              <EnhancedRelationshipBadge 
                                relationshipType={contact.relationshipType} 
                                className="text-xs"
                              />
                            </div>
                          ))}
                        {selectedContacts.length > 5 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ...and {selectedContacts.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Relationship type selector with smart suggestion */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Relationship Type:
                      </label>
                      <Select 
                        value={newRelationshipType} 
                        onValueChange={(value: RelationshipType) => setNewRelationshipType(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select relationship type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px] overflow-y-auto">
                          {/* Smart suggestion for lead_amplifier → past_client */}
                          {relationshipFilter === 'lead_amplifier' && 
                           relationshipTypes.some(t => t.name === 'past_client') && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                💡 Suggested
                              </div>
                              {relationshipTypes
                                .filter(t => t.name === 'past_client')
                                .map(type => (
                                  <SelectItem 
                                    key={type.name} 
                                    value={type.name}
                                    className="bg-blue-50 dark:bg-blue-900/20"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{type.label}</span>
                                      <Badge variant="outline" className="text-xs">
                                        Recommended
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              <div className="h-px bg-border my-1" />
                            </>
                          )}
                          
                          {/* All other relationship types */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            All Types
                          </div>
                          {relationshipTypes
                            .filter(t => t.name !== 'past_client' || relationshipFilter !== 'lead_amplifier')
                            .map(type => (
                              <SelectItem key={type.name} value={type.name}>
                                {type.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Impact summary */}
                    {newRelationshipType && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3">
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          <strong>{selectedContacts.length}</strong> contacts will be changed from{' '}
                          <strong className="font-mono text-xs">
                            {filteredContacts.find(c => selectedContacts.includes(c.id))?.relationshipType || 'current'}
                          </strong>
                          {' '}to{' '}
                          <strong className="font-mono text-xs">{newRelationshipType}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {bulkActionType === 'change-status' && (
                  <div className="space-y-4">
                    <p className="font-medium">
                      Change status for {selectedContacts.length} selected contact(s)?
                    </p>
                    
                    {/* Preview section */}
                    <div className="rounded-md border p-3 bg-muted/30">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">
                        Preview (showing first 5):
                      </p>
                      <div className="space-y-1">
                        {filteredContacts
                          .filter(c => selectedContacts.includes(c.id))
                          .slice(0, 5)
                          .map(contact => (
                            <div key={contact.id} className="text-sm flex items-center gap-2">
                              <span className="flex-1 truncate">{contact.name}</span>
                              <StatusBadge status={contact.status} />
                            </div>
                          ))}
                        {selectedContacts.length > 5 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ...and {selectedContacts.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Status:</label>
                      <Select value={newStatus} onValueChange={(value: LeadStatus) => setNewStatus(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px] overflow-y-auto">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost_maybe_later">Lost (Maybe Later)</SelectItem>
                          <SelectItem value="lost_not_fit">Lost (Not Fit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Impact summary */}
                    {newStatus && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3">
                        <p className="text-sm text-amber-900 dark:text-amber-100">
                          <strong>{selectedContacts.length}</strong> contact{selectedContacts.length > 1 ? 's' : ''} will be changed to{' '}
                          <strong className="capitalize">{newStatus.replace(/_/g, ' ')}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {bulkActionType === 'delete-contacts' && 
                  `Are you sure you want to permanently delete ${selectedContacts.length} selected contact(s)? This action cannot be undone and will remove all associated activities and data.`
                }
                {bulkActionType === 'delete-activities' && 
                  `Are you sure you want to delete all activities for ${selectedContacts.length} selected contact(s)? This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setBulkActionDialogOpen(false);
                setNewCategory('');
                setNewRelationshipType('lead');
                setNewStatus('none');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmBulkAction}
                disabled={
                  (bulkActionType === 'change-category' && !newCategory) ||
                  (bulkActionType === 'change-relationship' && !newRelationshipType) ||
                  (bulkActionType === 'change-status' && !newStatus)
                }
                className={bulkActionType === 'delete-contacts' || bulkActionType === 'delete-activities' ? 
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              >
                {bulkActionType === 'change-category' && 'Change Category'}
                {bulkActionType === 'change-relationship' && 'Change Relationship'}
                {bulkActionType === 'change-status' && 'Change Status'}
                {bulkActionType === 'delete-contacts' && 'Delete Contacts'}
                {bulkActionType === 'delete-activities' && 'Delete Activities'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}