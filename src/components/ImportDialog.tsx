import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { Contact, ContactCategory, RelationshipType, LeadStatus, RelationshipIntent, RelationshipStatus } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, CheckCircle, AlertCircle, X, ChevronsUpDown, Tag, Instagram } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getIconComponent } from "@/utils/iconMapping";
import { useToast } from "@/hooks/use-toast";
import { useContactCategories } from "@/hooks/useContactCategories";
import { useEnhancedRelationshipTypes } from "@/hooks/useEnhancedRelationshipTypes";
import { useContactContexts } from "@/hooks/useContactContexts";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Partial<Contact>[]) => Promise<{ contactIds: string[] }>;
  existingEmails: string[];
}

interface ParsedRow {
  name: string;
  email: string;
  company?: string;
  position?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  source?: string;
  notes?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

interface ImportDefaults {
  relationshipType: RelationshipType;
  relationshipIntent: RelationshipIntent;
  relationshipStatus: RelationshipStatus;
  status: LeadStatus;
  category: ContactCategory;
  source: string;
  contextTagIds: string[];
}

export function ImportDialog({ isOpen, onClose, onImport, existingEmails }: ImportDialogProps) {
  const { categories } = useContactCategories();
  const { relationshipTypes, getDefaultStatusForType, getStatusOptionsForType, getRelationshipTypeByName } = useEnhancedRelationshipTypes();
  const { contexts, loading: contextsLoading } = useContactContexts();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [defaults, setDefaults] = useState<ImportDefaults>({
    relationshipType: 'cold_lead',
    relationshipIntent: 'business_lead_statuses',
    relationshipStatus: 'cold',
    status: 'cold',
    category: 'uncategorized',
    source: 'CSV Import',
    contextTagIds: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [contextTagsOpen, setContextTagsOpen] = useState(false);
  const { toast } = useToast();

  // Update intent and status when relationship type changes
  useEffect(() => {
    const selectedType = getRelationshipTypeByName(defaults.relationshipType);
    if (selectedType) {
      const newIntent = selectedType.relationshipIntent;
      const newDefaultStatus = getDefaultStatusForType(defaults.relationshipType);
      
      setDefaults(prev => ({
        ...prev,
        relationshipIntent: newIntent,
        relationshipStatus: newDefaultStatus
      }));
    }
  }, [defaults.relationshipType, getRelationshipTypeByName, getDefaultStatusForType]);

  // Get available status options for current relationship type
  const availableStatusOptions = useMemo(() => {
    const statusOpts = getStatusOptionsForType(defaults.relationshipType);
    return Object.entries(statusOpts).map(([key, config]) => ({
      value: key,
      label: config.label
    }));
  }, [defaults.relationshipType, getStatusOptionsForType]);

  // Sort relationship types alphabetically by label
  const sortedRelationshipTypes = useMemo(() => {
    return [...relationshipTypes].sort((a, b) => 
      a.label.localeCompare(b.label)
    );
  }, [relationshipTypes]);

  const downloadTemplate = () => {
    const template = "name,email,company,position,phone,address,city,state,zip_code,country,linkedinUrl,websiteUrl,instagram,twitter,facebook,tiktok,relationshipStatus,relationshipIntent,contextTags,source,notes\nJohn Doe,john@example.com,Example Corp,Manager,(555) 123-4567,123 Main St,New York,NY,10001,USA,https://linkedin.com/in/johndoe,https://johndoe.com,@johndoe_insta,@johndoe,@john.doe,@johndoe_tiktok,Current Client,business_nurture_statuses,\"vip,referral\",Referral,Great contact from networking event";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Robust mapping for relationship types - maps old names to new standardized names
  const mapRelationshipType = (value: string): RelationshipType => {
    const normalized = value.toLowerCase().trim();
    const relationshipMap: Record<string, RelationshipType> = {
      // New standardized names
      'cold_lead': 'cold_lead',
      'warm_lead': 'warm_lead',
      'hot_lead': 'hot_lead',
      'client': 'client',
      'referral': 'referral',
      'partner': 'partner',
      'personal_contact': 'personal_contact',
      'general_contact': 'general_contact',
      // Old names → New names mapping
      'lead': 'cold_lead',
      'leads': 'cold_lead',
      'prospect': 'cold_lead',
      'prospects': 'cold_lead',
      'past client': 'referral',
      'past_client': 'referral',
      'pastclient': 'referral',
      'past clients': 'referral',
      'previous client': 'referral',
      'former client': 'referral',
      'clients': 'client',
      'current client': 'client',
      'booked client': 'client',
      'booked_client': 'client',
      'active client': 'client',
      'friend': 'personal_contact',
      'family': 'personal_contact',
      'friend_family': 'personal_contact',
      'friends': 'personal_contact',
      'associate': 'partner',
      'associates': 'partner',
      'partners': 'partner',
      'associate_partner': 'partner',
      'referral source': 'referral',
      'referral_source': 'referral',
      'referrer': 'referral',
      'lead amplifier': 'warm_lead',
      'lead_amplifier': 'warm_lead',
      'amplifier': 'warm_lead',
    };
    return relationshipMap[normalized] || 'cold_lead';
  };

  // Robust mapping for lead status
  const mapLeadStatus = (value: string): LeadStatus => {
    const normalized = value.toLowerCase().trim();
    const statusMap: Record<string, LeadStatus> = {
      'cold': 'cold',
      'cold lead': 'cold',
      'cold leads': 'cold',
      'warm': 'warm',
      'warm lead': 'warm',
      'warm leads': 'warm',
      'hot': 'hot',
      'hot lead': 'hot',
      'hot leads': 'hot',
      'won': 'won',
      'closed won': 'won',
      'closed': 'won',
      'lost maybe later': 'lost_maybe_later',
      'lost_maybe_later': 'lost_maybe_later',
      'maybe later': 'lost_maybe_later',
      'lost not fit': 'lost_not_fit',
      'lost_not_fit': 'lost_not_fit',
      'not fit': 'lost_not_fit',
      'no fit': 'lost_not_fit',
      'none': 'none',
      'no status': 'none',
    };
    return statusMap[normalized] || 'cold';
  };

  const normalizeHeader = (header: string): string => {
    const normalized = header.toLowerCase().trim().replace(/[^a-z]/g, '');
    // Map common variations to standard field names
    const headerMap: Record<string, string> = {
      'name': 'name',
      'fullname': 'name',
      'contactname': 'name',
      'clientname': 'name',
      'firstname': 'firstName',
      'fname': 'firstName',
      'first': 'firstName',
      'firstnames': 'firstName',
      'lastname': 'lastName',
      'lname': 'lastName',
      'last': 'lastName',
      'lastnames': 'lastName',
      'surname': 'lastName',
      'email': 'email',
      'emailaddress': 'email',
      'companyname': 'company',
      'organization': 'company',
      'jobtitle': 'position',
      'title': 'position',
      'role': 'position',
      'phonenumber': 'phone',
      'streetaddress': 'address',
      'address1': 'address',
      'zipcode': 'zip_code',
      'zip': 'zip_code',
      'postalcode': 'zip_code',
      'linkedin': 'linkedinUrl',
      'linkedinurl': 'linkedinUrl',
      'linkedinprofile': 'linkedinUrl',
      'website': 'websiteUrl',
      'websiteurl': 'websiteUrl',
      'webpage': 'websiteUrl',
      'leadsource': 'source',
      'comment': 'notes',
      'description': 'notes',
      'relationship': 'relationshipType',
      'relationshiptype': 'relationshipType',
      'status': 'leadStatus',
      'leadstatus': 'leadStatus',
      'relationshipstatus': 'relationshipStatus',
      'relationshipintent': 'relationshipIntent',
      'contexttags': 'contextTags',
      'tags': 'contextTags',
    };
    return headerMap[normalized] || normalized;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRow = (row: any, csvEmails: Set<string>, currentIndex: number): ParsedRow & { relationshipType?: RelationshipType; leadStatus?: LeadStatus; relationshipStatus?: string; relationshipIntent?: string; contextTags?: string[] } => {
    const errors: string[] = [];
    
    // Enhanced name composition logic
    let name = (row.name || '').toString().trim();
    
    // If no name field, try to compose from firstName/lastName
    if (!name) {
      const firstName = (row.firstName || '').toString().trim();
      const lastName = (row.lastName || '').toString().trim();
      
      if (firstName && lastName) {
        name = `${firstName} ${lastName}`;
      } else if (firstName) {
        name = firstName;
      } else if (lastName) {
        name = lastName;
      }
    }
    
    // If still no name and we have an email, derive from email
    const email = (row.email || '').toString().trim().toLowerCase();
    if (!name && email) {
      const emailLocal = email.split('@')[0];
      // Convert common patterns like john.doe to John Doe
      name = emailLocal
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    // Validation: only require name if we couldn't derive it from any source
    if (!name) errors.push('Name is required (no name, firstName/lastName, or email to derive from)');
    if (!email) {
      // Only require email for non-Instagram imports
      if (!row.instagram) {
        errors.push('Email is required');
      }
    } else if (!validateEmail(email)) {
      errors.push('Invalid email format');
    }

    // Check duplicates: first against existing database, then against CSV
    const isDatabaseDuplicate = existingEmails.includes(email);
    const isCsvDuplicate = csvEmails.has(email);
    const isDuplicate = isDatabaseDuplicate || isCsvDuplicate;
    
    if (isDatabaseDuplicate) {
      errors.push('Email already exists in database');
    } else if (isCsvDuplicate) {
      errors.push('Duplicate email in CSV file');
    }

    // Add to CSV emails set if this is the first occurrence
    if (email && !csvEmails.has(email)) {
      csvEmails.add(email);
    }

    // Handle relationship type and status mapping if provided in CSV
    let mappedRelationshipType: RelationshipType | undefined;
    let mappedLeadStatus: LeadStatus | undefined;
    let mappedRelationshipStatus: string | undefined;
    let mappedRelationshipIntent: string | undefined;
    let parsedContextTags: string[] | undefined;

    if (row.relationshipType) {
      mappedRelationshipType = mapRelationshipType(row.relationshipType.toString().trim());
    }
    if (row.leadStatus) {
      mappedLeadStatus = mapLeadStatus(row.leadStatus.toString().trim());
    }
    if (row.relationshipStatus) {
      mappedRelationshipStatus = row.relationshipStatus.toString().trim();
    }
    if (row.relationshipIntent) {
      mappedRelationshipIntent = row.relationshipIntent.toString().trim();
    }
    if (row.contextTags) {
      parsedContextTags = row.contextTags
        .toString()
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean);
    }

    return {
      name,
      email,
      company: (row.company || '').toString().trim() || undefined,
      position: (row.position || '').toString().trim() || undefined,
      phone: (row.phone || '').toString().trim() || undefined,
      address: (row.address || '').toString().trim() || undefined,
      city: (row.city || '').toString().trim() || undefined,
      state: (row.state || '').toString().trim() || undefined,
      zip_code: (row.zip_code || '').toString().trim() || undefined,
      country: (row.country || '').toString().trim() || undefined,
      linkedinUrl: (row.linkedinUrl || '').toString().trim() || undefined,
      websiteUrl: (row.websiteUrl || '').toString().trim() || undefined,
      instagram: (row.instagram || '').toString().trim() || undefined,
      twitter: (row.twitter || '').toString().trim() || undefined,
      facebook: (row.facebook || '').toString().trim() || undefined,
      tiktok: (row.tiktok || '').toString().trim() || undefined,
      source: (row.source || '').toString().trim() || undefined,
      notes: (row.notes || '').toString().trim() || undefined,
      relationshipType: mappedRelationshipType,
      leadStatus: mappedLeadStatus,
      relationshipStatus: mappedRelationshipStatus,
      relationshipIntent: mappedRelationshipIntent,
      contextTags: parsedContextTags,
      isValid: errors.length === 0,
      isDuplicate,
      errors
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    setFile(uploadedFile);
    setIsProcessing(true);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => {
        const csvEmails = new Set<string>();
        
        // Enhanced parsing to handle firstName/lastName composition
        const parsed = results.data.map((row: any, index: number) => {
          // Pre-process the row to compose name field if needed
          const processedRow = { ...row };
          
          // If no name field but we have firstName/lastName, set up for validation
          if (!processedRow.name && (processedRow.firstName || processedRow.lastName)) {
            // Let validateRow handle the composition
          }
          
          return validateRow(processedRow, csvEmails, index);
        });
        
        setParsedData(parsed);
        setIsProcessing(false);
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    });
  };

  const parseInstagramJSON = (jsonData: any): ParsedRow[] => {
    const rows: ParsedRow[] = [];
    
    // Instagram export structure: array of objects with string_list_data
    const followersArray = Array.isArray(jsonData) ? jsonData : jsonData.followers_1 || [];
    
    followersArray.forEach((followerObj: any) => {
      const data = followerObj.string_list_data?.[0];
      if (!data) return;
      
      const username = data.value;
      const profileUrl = data.href;
      const timestamp = data.timestamp;
      const followDate = new Date(timestamp * 1000);
      
      rows.push({
        name: `@${username}`,
        email: null, // Will be enriched later
        instagram: username,
        websiteUrl: profileUrl,
        source: defaults.source || 'Instagram Import',
        notes: `Instagram profile: ${profileUrl}\nFollowed since: ${followDate.toLocaleDateString()}`,
        isValid: true,
        isDuplicate: false,
        errors: []
      });
    });
    
    return rows;
  };

  const handleInstagramUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const parsed = parseInstagramJSON(jsonData);
        
        // Check for duplicates against existing emails (none for Instagram initially)
        const duplicateChecked = parsed.map(row => ({
          ...row,
          isDuplicate: false
        }));
        
        setParsedData(duplicateChecked);
        
        toast({
          title: "Instagram Data Parsed",
          description: `Found ${parsed.length} Instagram followers ready to import`,
        });
      } catch (error) {
        console.error('Parse error:', error);
        toast({
          title: "Parse Error",
          description: "Invalid Instagram JSON format. Please upload followers_1.json from your Instagram data export.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    
    const validContacts = parsedData.filter(row => row.isValid && !row.isDuplicate);
    
    if (validContacts.length === 0) {
      toast({
        title: "No valid contacts to import",
        description: "Please fix validation errors or duplicates before importing",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Use mapped values from CSV or defaults, apply smart coupling
    const contactsToImport = validContacts.map(row => {
      const relationshipType = (row as any).relationshipType || defaults.relationshipType;
      const status = (row as any).leadStatus || defaults.status;
      const relationshipStatus = (row as any).relationshipStatus || defaults.relationshipStatus;
      const relationshipIntent = (row as any).relationshipIntent || defaults.relationshipIntent;
      
      // Smart coupling: won status should set relationship to client
      const finalRelationshipType = status === 'won' ? 'client' : relationshipType;

      return {
        name: row.name,
        email: row.email || null,
        company: row.company || null,
        phone: row.phone || null,
        position: row.position || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        zip_code: row.zip_code || null,
        country: row.country || null,
        linkedin_url: row.linkedinUrl || null,
        website_url: row.websiteUrl || null,
        social_media_links: {
          instagram: row.instagram || '',
          twitter: row.twitter || '',
          facebook: row.facebook || '',
          tiktok: row.tiktok || ''
        },
        status,
        relationship_type: finalRelationshipType,
        relationship_status: relationshipStatus,
        relationship_intent: relationshipIntent,
        category: defaults.category,
        source: row.source || defaults.source,
        notes: row.notes || null,
        response_received: false,
        total_touchpoints: 0,
        booking_scheduled: false,
        archived: false,
        next_follow_up: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        contextTags: (row as any).contextTags, // Pass through for context assignment
      };
    });

    try {
      console.log(`📦 Importing ${contactsToImport.length} contacts`);
      console.log('🔍 Import data preview:', contactsToImport.slice(0, 2));
      
      const result = await onImport(contactsToImport);
      
      // Assign context tags after successful import
      if (defaults.contextTagIds.length > 0 && result.contactIds.length > 0) {
        const contextAssignments = [];
        for (const contactId of result.contactIds) {
          for (const contextId of defaults.contextTagIds) {
            contextAssignments.push({
              contact_id: contactId,
              context_id: contextId
            });
          }
        }
        
        const { error: contextError } = await supabase
          .from('contact_context_assignments')
          .insert(contextAssignments);
        
        if (contextError) {
          console.error('Context tag assignment error:', contextError);
          toast({
            title: "Partial success",
            description: "Contacts imported but some context tags failed to apply.",
            variant: "destructive"
          });
        }
      }
      
      // Note: Success toast will be handled by the parent component
      // which has more detailed information about actual import results
      handleClose();
    } catch (error) {
      console.error('❌ Import failed:', error);
      
      let errorMessage = "There was an error importing your contacts. Please try again.";
      if (error instanceof Error) {
        console.error('📋 Error details:', error.message);
        
        // Provide more specific error messages
        if (error.message.includes('Authentication') || error.message.includes('Session')) {
          errorMessage = "Authentication expired. Please sign in again and retry the import.";
        } else if (error.message.includes('Permission') || error.message.includes('access')) {
          errorMessage = "You don't have permission to import contacts. Please check your account status.";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "Some contacts already exist. Please remove duplicates and try again.";
        } else if (error.message.includes('validation')) {
          errorMessage = "Some contact data is invalid. Please check the format and try again.";
        }
      }
      
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setShowAllRows(false);
    setDefaults({
      relationshipType: 'cold_lead',
      relationshipIntent: 'business_lead_statuses',
      relationshipStatus: 'cold',
      status: 'cold',
      category: 'uncategorized',
      source: 'CSV Import',
      contextTagIds: []
    });
    onClose();
  };

  const getValidationBadge = (row: ParsedRow) => {
    if (row.isDuplicate) {
      const isDbDuplicate = row.errors.some(e => e.includes('database'));
      const duplicateText = isDbDuplicate ? 'Exists in DB' : 'Duplicate in file';
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />{duplicateText}</Badge>;
    }
    if (!row.isValid) {
      return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Invalid</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
  };

  const validCount = parsedData.filter(row => row.isValid && !row.isDuplicate).length;
  const duplicateCount = parsedData.filter(row => row.isDuplicate).length;
  const invalidCount = parsedData.filter(row => !row.isValid && !row.isDuplicate).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-card-foreground">Import Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Tabs for CSV and Instagram Import */}
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">CSV Import</TabsTrigger>
              <TabsTrigger value="instagram">Instagram JSON</TabsTrigger>
            </TabsList>
            
            <TabsContent value="csv" className="space-y-4">
              {/* File Upload Section */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="csv-file" className="text-foreground font-medium">Upload CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mt-2 bg-background border-border text-foreground file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="mt-8 border-border hover:bg-muted"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Processing CSV file...
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="instagram" className="space-y-4">
              <Alert>
                <Instagram className="h-4 w-4" />
                <AlertTitle>Import Instagram Followers</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                    <li>Go to Instagram → Settings → Privacy → Download Your Information</li>
                    <li>Select JSON format and request download</li>
                    <li>Wait 1-2 days for Instagram to prepare your data</li>
                    <li>Extract the ZIP and upload <code className="bg-muted px-1 py-0.5 rounded">followers_1.json</code> here</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="instagram-file">Select followers_1.json</Label>
                <Input
                  id="instagram-file"
                  type="file"
                  accept=".json"
                  onChange={handleInstagramUpload}
                  className="bg-background border-border text-foreground file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                />
              </div>
              
              {parsedData.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {parsedData.length} Instagram contacts. After import, use "Start Research" to enrich profiles with contact information from their bios.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {/* Import Defaults */}
          {file && (
            <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
              <h3 className="font-medium text-card-foreground">Import Defaults</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground">Relationship Type</Label>
                  <Select value={defaults.relationshipType} onValueChange={(value: RelationshipType) => setDefaults({...defaults, relationshipType: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {sortedRelationshipTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-foreground">Lead Status</Label>
                  <Select value={defaults.status} onValueChange={(value: LeadStatus) => setDefaults({...defaults, status: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Category</Label>
                  <Select value={defaults.category} onValueChange={(value: ContactCategory) => setDefaults({...defaults, category: value})}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.label}
                        </SelectItem>
                      ))}
                      {categories.length === 0 && (
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      )}
                      <SelectItem value="hoa_leasing">HOA/Leasing</SelectItem>
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Default Source</Label>
                  <Input
                    value={defaults.source}
                    onChange={(e) => setDefaults({...defaults, source: e.target.value})}
                    placeholder="CSV Import"
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Relationship Status</Label>
                  <Select 
                    value={defaults.relationshipStatus} 
                    onValueChange={(value: RelationshipStatus) => setDefaults({...defaults, relationshipStatus: value})}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {availableStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Context Tags</Label>
                  <Popover open={contextTagsOpen} onOpenChange={setContextTagsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contextTagsOpen}
                        className="w-full justify-between bg-background border-border text-foreground hover:bg-muted"
                      >
                        {defaults.contextTagIds.length > 0
                          ? `${defaults.contextTagIds.length} tag${defaults.contextTagIds.length > 1 ? 's' : ''} selected`
                          : "Select tags..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover border-border">
                      <Command className="bg-popover">
                        <CommandInput placeholder="Search tags..." className="bg-popover text-foreground" />
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {contextsLoading ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading tags...</div>
                          ) : (
                            contexts.map((context) => {
                              const IconComponent = getIconComponent(context.iconName || 'Tag');
                              return (
                                <CommandItem
                                  key={context.id}
                                  value={context.name}
                                  onSelect={() => {
                                    setDefaults(prev => ({
                                      ...prev,
                                      contextTagIds: prev.contextTagIds.includes(context.id)
                                        ? prev.contextTagIds.filter(id => id !== context.id)
                                        : [...prev.contextTagIds, context.id]
                                    }));
                                  }}
                                  className="text-foreground hover:bg-muted cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      defaults.contextTagIds.includes(context.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Badge className={`${context.colorClass || 'bg-secondary'} pointer-events-none`}>
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {context.label || context.name}
                                  </Badge>
                                </CommandItem>
                              );
                            })
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Preview {showAllRows ? `(All ${parsedData.length} rows)` : '(First 10 rows)'}
                </h3>
                <div className="flex gap-2 text-sm">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">{validCount} Valid</Badge>
                  {duplicateCount > 0 && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">{duplicateCount} Duplicates</Badge>}
                  {invalidCount > 0 && <Badge variant="destructive">{invalidCount} Invalid</Badge>}
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-auto max-h-96 bg-card">
                <Table>
                  <TableHeader>
                     <TableRow className="border-border bg-muted/50">
                       <TableHead className="text-foreground font-medium">Status</TableHead>
                       <TableHead className="text-foreground font-medium">Name</TableHead>
                       <TableHead className="text-foreground font-medium">Email</TableHead>
                       <TableHead className="text-foreground font-medium">Company</TableHead>
                       <TableHead className="text-foreground font-medium">Position</TableHead>
                       <TableHead className="text-foreground font-medium">Phone</TableHead>
                       <TableHead className="text-foreground font-medium">City</TableHead>
                       <TableHead className="text-foreground font-medium">Errors</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {(showAllRows ? parsedData : parsedData.slice(0, 10)).map((row, index) => (
                       <TableRow key={index} className="border-border hover:bg-muted/30">
                         <TableCell className="bg-background">{getValidationBadge(row)}</TableCell>
                         <TableCell className="bg-background text-foreground font-medium">{row.name}</TableCell>
                         <TableCell className="bg-background text-foreground">{row.email}</TableCell>
                         <TableCell className="bg-background text-muted-foreground">{row.company || '-'}</TableCell>
                         <TableCell className="bg-background text-muted-foreground">{row.position || '-'}</TableCell>
                         <TableCell className="bg-background text-muted-foreground">{row.phone || '-'}</TableCell>
                         <TableCell className="bg-background text-muted-foreground">{row.city || '-'}</TableCell>
                         <TableCell className="bg-background">
                           {row.errors.length > 0 && (
                             <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                               {row.errors.join(', ')}
                             </div>
                           )}
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </div>
              
              {parsedData.length > 10 && !showAllRows && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllRows(true)}
                    className="text-primary hover:bg-primary/10 border-primary/20"
                  >
                    View all {parsedData.length} records
                  </Button>
                </div>
              )}
              
              {showAllRows && parsedData.length > 10 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllRows(false)}
                    className="text-muted-foreground hover:bg-muted"
                  >
                    Show less (first 10 only)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="border-border hover:bg-muted">
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={validCount === 0 || isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? 'Importing...' : `Import ${validCount} Contact${validCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}