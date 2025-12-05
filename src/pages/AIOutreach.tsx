import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Copy, 
  Sparkles, 
  Settings, 
  RefreshCw, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Wand2,
  Target,
  MessageSquare,
  Mail,
  Linkedin,
  Phone,
  Share2,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  HelpCircle,
  Search,
  Globe,
  Eye,
  Loader2,
  Calendar,
  Edit,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useAccess } from '@/hooks/useAccess';
import { AIQuotaCard } from '@/components/AIQuotaCard';
import { TokenBreakdownCard } from '@/components/TokenBreakdownCard';
import { ContactCategory, OutreachRequest, Contact } from '@/types/crm';
import { useContactCategories } from '@/hooks/useContactCategories';
import { useContactResearchWithQuota } from '@/hooks/useContactResearchWithQuota';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCRMData } from '@/hooks/useCRMData';
import { useContactContexts } from '@/hooks/useContactContexts';
import { useEnhancedRelationshipTypes } from '@/hooks/useEnhancedRelationshipTypes';
import { useCampaigns, useLogCampaignOutreach } from '@/hooks/useCampaigns';

const CONTACT_CATEGORIES: { value: ContactCategory; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'corporate_planner', label: 'Corporate Planner', description: 'Fill calendar, protect property, enhance guest experience', icon: Users },
  { value: 'wedding_planner', label: 'Wedding Planner', description: 'Reliable partners, fast quotes, seamless execution', icon: Target },
  { value: 'caterer', label: 'Caterer', description: 'Reliable beverage partner, smooth coordination', icon: Users },
  { value: 'dj', label: 'DJ/Entertainment', description: 'Content opportunities, mutual referrals', icon: TrendingUp },
  { value: 'photographer', label: 'Photographer', description: 'Content opportunities, referrals from events', icon: Target },
  { value: 'hr', label: 'HR/People Ops', description: 'Easy holiday parties, predictable budgets, no liability', icon: Users },
  { value: 'venue', label: 'Venue', description: 'Fill calendar, venue-friendly setup, no drama', icon: Target },
  { value: 'hoa_leasing', label: 'HOA/Property Manager', description: 'Resident engagement, budget-friendly, minimal mess', icon: Users },
  { value: 'creator', label: 'Content Creator', description: 'Content opportunities, shout-outs, mutual referrals', icon: TrendingUp },
  { value: 'other', label: 'Other', description: 'Custom segment with specific goals', icon: Target },
];

const PSYCHOLOGICAL_LEVERS = [
  { value: 'Risk reduction', description: 'COI, compliance, professional standards', icon: '🛡️' },
  { value: 'Ease & convenience', description: 'Turn-key service, simple coordination', icon: '⚡' },
  { value: 'Social currency', description: 'Making them look good to clients', icon: '✨' },
  { value: 'Scarcity/urgency', description: 'Limited dates, booking deadlines', icon: '⏰' },
  { value: 'Reciprocity', description: 'Offering value upfront', icon: '🤝' },
  { value: 'Authority/expertise', description: 'Industry credentials, experience', icon: '👑' },
  { value: 'Social proof', description: 'Client testimonials, referrals', icon: '⭐' },
];

const PROOF_ASSETS = [
  'Certificate of Insurance (COI)',
  'TIPS certification',
  'Venue references',
  'Client testimonials',
  'Photo portfolio',
  'SOPs document',
  'Pricing packages',
  'Menu mockups',
  'Brand wrap examples',
  'Liability coverage details',
];

interface GeneratedContent {
  subjectLine: string;
  emailBody: string;
  linkedinMessage: string;
  socialMediaPost?: string;
  callScript?: string;
  followUpSuggestion: string;
  keyAngle: string;
  proofPoints: string[];
  callToAction: string;
}

// Web Research Component
const WebResearchSection: React.FC<{
  selectedContact: Contact | null;
  enableResearch: boolean;
  onEnableChange: (enabled: boolean) => void;
  research: any;
  isResearchLoading: boolean;
  isStartingResearch: boolean;
  startResearch: () => Promise<void>;
  canAffordResearch: boolean;
  quotaInfo: any;
  onSaveUrls?: (websiteUrl: string, linkedinUrl: string) => void;
}> = ({ selectedContact, enableResearch, onEnableChange, research, isResearchLoading, isStartingResearch, startResearch, canAffordResearch, quotaInfo, onSaveUrls }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [urlsSaved, setUrlsSaved] = useState(false);

  // Auto-populate URLs when contact changes
  React.useEffect(() => {
    if (selectedContact) {
      setWebsiteUrl(selectedContact.websiteUrl || '');
      setLinkedinUrl(selectedContact.linkedinUrl || '');
    }
  }, [selectedContact]);

  const handleUrlSave = (websiteUrl: string, linkedinUrl: string) => {
    if (onSaveUrls && selectedContact) {
      onSaveUrls(websiteUrl, linkedinUrl);
      setUrlsSaved(true);
      setTimeout(() => setUrlsSaved(false), 2000);
    }
  };

  const handleWebsiteBlur = () => {
    const normalizedWebsite = websiteUrl.trim();
    const normalizedLinkedin = linkedinUrl.trim();
    
    // Only save if URLs are different from contact's current URLs
    if (selectedContact && (
      normalizedWebsite !== (selectedContact.websiteUrl || '') ||
      normalizedLinkedin !== (selectedContact.linkedinUrl || '')
    )) {
      handleUrlSave(normalizedWebsite, normalizedLinkedin);
    }
  };

  const handleLinkedinBlur = () => {
    const normalizedWebsite = websiteUrl.trim();
    const normalizedLinkedin = linkedinUrl.trim();
    
    // Only save if URLs are different from contact's current URLs
    if (selectedContact && (
      normalizedWebsite !== (selectedContact.websiteUrl || '') ||
      normalizedLinkedin !== (selectedContact.linkedinUrl || '')
    )) {
      handleUrlSave(normalizedWebsite, normalizedLinkedin);
    }
  };

  const handleStartResearch = async () => {
    if (!selectedContact || !canAffordResearch) return;
    
    // Save URLs before starting research
    const normalizedWebsite = websiteUrl.trim();
    const normalizedLinkedin = linkedinUrl.trim();
    
    if (normalizedWebsite || normalizedLinkedin) {
      handleUrlSave(normalizedWebsite, normalizedLinkedin);
    }
    
    try {
      await startResearch();
    } catch (error) {
      console.error('Research error:', error);
    }
  };

  const getResearchStatus = () => {
    if (!research) return null;
    
    switch (research.status) {
      case 'processing':
        return { icon: Loader2, text: 'Processing...', color: 'text-blue-500' };
      case 'completed':
        return { icon: CheckCircle, text: 'Completed', color: 'text-green-500' };
      case 'error':
        return { icon: AlertTriangle, text: 'Error', color: 'text-red-500' };
      default:
        return null;
    }
  };

  const status = getResearchStatus();

  return (
    <Card className="bg-muted/20 border-dashed border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <h4 className="font-medium">Web Research (Firecrawl)</h4>
            {status && (
              <div className="flex items-center gap-1.5">
                <status.icon className={`w-3 h-3 ${status.color} ${status.text === 'Processing...' ? 'animate-spin' : ''}`} />
                <span className={`text-xs ${status.color}`}>{status.text}</span>
              </div>
            )}
          </div>
          <Switch
            checked={enableResearch}
            onCheckedChange={onEnableChange}
            disabled={!selectedContact}
          />
        </div>

        {enableResearch && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Automatically scrape website and LinkedIn data to enrich your outreach with personalized insights.
              <span className="font-medium text-amber-600 ml-1">
                (~2,000 tokens estimated)
              </span>
            </p>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium">Website URL</label>
                  {urlsSaved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Saved to contact
                    </span>
                  )}
                </div>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  onBlur={handleWebsiteBlur}
                  placeholder="https://company-website.com"
                  className="h-10 text-sm"
                  disabled={!selectedContact}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">LinkedIn URL</label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  onBlur={handleLinkedinBlur}
                  placeholder="https://linkedin.com/in/contact-name"
                  className="h-10 text-sm"
                  disabled={!selectedContact}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartResearch}
                disabled={!selectedContact || !canAffordResearch || isStartingResearch || isResearchLoading}
                className="flex items-center gap-2"
              >
                {isStartingResearch ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    Run Research
                  </>
                )}
              </Button>

              {research && research.status === 'completed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              )}

              {!canAffordResearch && quotaInfo && (
                <span className="text-xs text-red-500">
                  Insufficient quota ({quotaInfo.remaining} tokens remaining)
                </span>
              )}
            </div>

            {research && research.status === 'completed' && research.research_data && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Research Complete</span>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  {research.research_data.keyFacts && research.research_data.keyFacts.length > 0 && (
                    <p>• {research.research_data.keyFacts.length} key facts discovered</p>
                  )}
                  {research.research_data.icebreakers && research.research_data.icebreakers.length > 0 && (
                    <p>• {research.research_data.icebreakers.length} conversation starters</p>
                  )}
                  {research.research_data.outreachAngles && research.research_data.outreachAngles.length > 0 && (
                    <p>• {research.research_data.outreachAngles.length} outreach angles</p>
                  )}
                </div>
              </div>
            )}

            {research && research.status === 'error' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Research Failed</span>
                </div>
                <p className="text-xs text-red-700">
                  {research.error_message || 'Unable to complete web research. You can still generate outreach without it.'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AIOutreach() {
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingEmailSubject, setIsEditingEmailSubject] = useState(false);
  const [isEditingLinkedIn, setIsEditingLinkedIn] = useState(false);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isEditingCall, setIsEditingCall] = useState(false);
  const [showBusinessProfile, setShowBusinessProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [enableResearch, setEnableResearch] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('none');
  const [overrideCampaignSettings, setOverrideCampaignSettings] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, saveProfile, loading: profileLoading } = useBusinessProfile();
  const location = useLocation();
  const { saveContact, saveActivity } = useCRMData();
  const { categories } = useContactCategories();
  const { contexts } = useContactContexts();
  const { relationshipTypes } = useEnhancedRelationshipTypes();
  const { activeCampaigns } = useCampaigns();
  const logCampaignOutreach = useLogCampaignOutreach();
  
  // Import useAccess to get canWrite for access validation
  const { canWrite } = useAccess();

  // Add research hook for access in main component
  const { 
    research, 
    isLoading: isResearchLoading, 
    isStartingResearch, 
    startResearch, 
    canAffordResearch, 
    quotaInfo 
  } = useContactResearchWithQuota(selectedContact?.id || '');

  const form = useForm<OutreachRequest>({
    defaultValues: {
      outreachType: 'cold',
      segment: 'other',
      goals: '',
      tone: 'professional',
      psychologicalLevers: [],
      channel: 'email',
      sequenceStep: 1,
      length: 'medium',
      holidayEdition: false,
      proofAssets: [],
      personalizationTokens: '',
      contactName: '',
      offerIncentive: '',
      callToAction: '',
      contactSpecificGoal: '',
      coreDesire: 'not_sure',
      coreFear: 'not_sure',
    },
  });

  const businessForm = useForm({
    defaultValues: {
      businessName: profile?.businessName || '',
      valueProp: profile?.valueProp || '',
      industry: profile?.industry || '',
      targetMarket: profile?.targetMarket || '',
      keyDifferentiators: profile?.keyDifferentiators || '',
    },
  });

  useEffect(() => {
    if (profile) {
      businessForm.reset({
        businessName: profile.businessName,
        valueProp: profile.valueProp || '',
        industry: profile.industry || '',
        targetMarket: profile.targetMarket || '',
        keyDifferentiators: profile.keyDifferentiators || '',
      });
    }
  }, [profile, businessForm]);

  // Load contact from URL parameters and handle profile parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const contactId = urlParams.get('contactId');
    const channel = urlParams.get('channel') as 'email' | 'linkedin' | null;
    const autostart = urlParams.get('autostart') === '1';
    const showProfile = urlParams.get('profile') === '1';
    const campaignId = urlParams.get('campaignId');

    // Only load contact if we have both contactId and user, and haven't loaded this contact yet
    if (contactId && user && (!selectedContact || selectedContact.id !== contactId)) {
      loadContact(contactId, channel, autostart);
    }
    
    if (showProfile) {
      setShowBusinessProfile(true);
    }

    if (campaignId && campaignId !== selectedCampaignId) {
      setSelectedCampaignId(campaignId);
    }
  }, [location.search, user, selectedContact, selectedCampaignId]);

  // Auto-populate form from campaign data when campaign is selected
  useEffect(() => {
    if (selectedCampaignId && selectedCampaignId !== 'none' && activeCampaigns && !overrideCampaignSettings) {
      const selectedCampaign = activeCampaigns.find(c => c.id === selectedCampaignId);
      if (selectedCampaign) {
        // Auto-populate tone if campaign has it (validate it's a valid tone)
        const validTones = ['professional', 'casual', 'urgent', 'friendly'] as const;
        if (selectedCampaign.tone && validTones.includes(selectedCampaign.tone as any)) {
          form.setValue('tone', selectedCampaign.tone as 'professional' | 'casual' | 'urgent' | 'friendly');
        }
        
        // Auto-populate CTA if campaign has it
        if (selectedCampaign.call_to_action) {
          form.setValue('callToAction', selectedCampaign.call_to_action);
        }
        
        // Auto-populate segment from first target_segment
        if (selectedCampaign.target_segments && selectedCampaign.target_segments.length > 0) {
          form.setValue('segment', selectedCampaign.target_segments[0]);
        }
        
        // Auto-populate goals from campaign_goal
        if (selectedCampaign.campaign_goal) {
          form.setValue('goals', selectedCampaign.campaign_goal);
        }
      }
    }
  }, [selectedCampaignId, activeCampaigns, overrideCampaignSettings, form]);

  // Persist URLs back to contact record
  const persistUrls = async (websiteUrl: string, linkedinUrl: string) => {
    if (!selectedContact) return;

    const normalizedWebsite = websiteUrl.trim();
    const normalizedLinkedin = linkedinUrl.trim();

    // Only update if URLs are different
    const hasChanges = 
      normalizedWebsite !== (selectedContact.websiteUrl || '') ||
      normalizedLinkedin !== (selectedContact.linkedinUrl || '');

    if (!hasChanges) return;

    try {
      const updatedContact = {
        ...selectedContact,
        websiteUrl: normalizedWebsite || undefined,
        linkedinUrl: normalizedLinkedin || undefined,
      };

      await saveContact(updatedContact);
      
      // Update local state
      setSelectedContact(updatedContact);
      
      toast({
        title: "URLs saved",
        description: "Website and LinkedIn URLs updated in contact card",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving URLs:', error);
      toast({
        title: "Error",
        description: "Failed to save URLs to contact",
        variant: "destructive",
      });
    }
  };

  const loadContact = async (contactId: string, channel: 'email' | 'linkedin' | null, autostart: boolean) => {
    console.log('🔍 Loading contact with ID:', contactId, 'Channel:', channel, 'Autostart:', autostart);
    
    // Prevent multiple autostart executions for the same contact
    if (autostart && generatedContent) {
      console.log('🛑 Autostart skipped - content already generated');
      return;
    }
    
    setLoadingContact(true);
    try {
      let contact = null;
      let error = null;
      
      // First try to load from Supabase (for live data)
      try {
        console.log('📡 Attempting Supabase query for contact ID:', contactId);
        const { data, error: supabaseError } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('user_id', user?.id)
          .maybeSingle();
        
        console.log('📡 Supabase response:', { data, error: supabaseError });
        contact = data;
        error = supabaseError;
      } catch (supabaseError: any) {
        console.log('❌ Supabase error caught:', supabaseError);
      // If it's a UUID format error, try loading from mock data
      if (supabaseError.code === '22P02' || supabaseError.message?.includes('invalid input syntax for type uuid')) {
        console.log('🔄 Invalid UUID format, checking mock data...');
        
        // Use consistent mock data that matches useCRMData.ts
        const mockContacts = [
            {
              id: "1",
              name: "Sarah Johnson",
              email: "sarah@grandballroom.com",
              company: "The Grand Ballroom",
              position: "Event Coordinator",
              phone: "(555) 123-4567",
              linkedin_url: "https://linkedin.com/in/sarahjohnson",
              website_url: "https://grandballroom.com",
              social_media_links: { instagram: "@grandballroom", facebook: "The Grand Ballroom" },
              status: "warm",
              relationship_type: "lead",
              category: "venue",
              source: "Referral from Maria at Downtown Events",
              created_at: new Date().toISOString(),
              last_contact_date: null,
              next_follow_up: null,
              notes: "Looking for reliable bartending service for wedding receptions. Handles 150+ guest events.",
              response_received: false,
              total_touchpoints: 2,
              booking_scheduled: false,
              archived: false,
            },
            {
              id: "2",
              name: "Michael Chen",
              email: "m.chen@innovate.io",
              company: "Innovate.io",
              position: "CEO",
              phone: "(555) 234-5678",
              linkedin_url: "https://linkedin.com/in/michaelchen",
              website_url: "https://innovate.io",
              social_media_links: { linkedin: "https://linkedin.com/company/innovate" },
              status: "hot",
              relationship_type: "referral",
              category: "venue",
              source: "Website Contact Form",
              created_at: new Date().toISOString(),
              last_contact_date: new Date().toISOString(),
              next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              notes: "Ready to move forward. Scheduled demo for next week.",
              response_received: true,
              total_touchpoints: 5,
              booking_scheduled: false,
              archived: false,
            },
            {
              id: "3",
              name: "Jennifer Chen",
              email: "jen@dreamweddings.net", 
              company: "Dream Weddings by Jen",
              position: "Lead Wedding Planner",
              phone: "(555) 345-6789",
              linkedin_url: "https://linkedin.com/in/jenniferchen",
              website_url: "https://dreamweddings.net",
              social_media_links: { instagram: "@dreamweddingsbyjen", facebook: "Dream Weddings by Jen" },
              status: "cold",
              relationship_type: "lead",
              category: "wedding_planner", 
              source: "Wedding expo contact",
              created_at: new Date().toISOString(),
              last_contact_date: null,
              next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              notes: "Plans 20+ weddings per year. Interested in premium bar service options.",
              response_received: false,
              total_touchpoints: 1,
              booking_scheduled: false,
              archived: false,
            }
          ];
          
          contact = mockContacts.find(c => c.id === contactId);
          console.log('🎭 Mock data search result for ID', contactId, ':', contact);
          if (!contact) {
            throw new Error(`Contact not found in mock data for ID: ${contactId}`);
          }
        } else {
          throw supabaseError;
        }
      }
      
      if (!contact) {
        console.log('❌ No contact found after all attempts');
        toast({
          title: "Contact not found",
          description: "The contact could not be loaded. It may have been deleted or you don't have access to it.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Contact found:', contact);
      const contactData: Contact = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        position: contact.position,
        phone: contact.phone,
        linkedinUrl: contact.linkedin_url,
        websiteUrl: contact.website_url,
        socialMediaLinks: contact.social_media_links as any,
        status: contact.status as any,
        relationshipType: contact.relationship_type as any,
        category: contact.category as any,
        source: contact.source,
        createdAt: new Date(contact.created_at),
        lastContactDate: contact.last_contact_date ? new Date(contact.last_contact_date) : undefined,
        nextFollowUp: contact.next_follow_up ? new Date(contact.next_follow_up) : undefined,
        notes: contact.notes,
        responseReceived: contact.response_received,
        totalTouchpoints: contact.total_touchpoints,
        bookingScheduled: contact.booking_scheduled,
        archived: contact.archived,
      };

      console.log('🎯 Setting selected contact:', contactData);
      setSelectedContact(contactData);
      
      console.log('📝 Populating form from contact...');
      populateFormFromContact(contactData, channel);

      if (autostart && profile && !generating) {
        console.log('🚀 Autostart enabled, triggering form submission...');
        // Small delay to ensure form is populated and segment is properly set
        setTimeout(() => {
          try {
            // Check one more time to prevent duplicate submissions
            if (generating) {
              console.log('🛑 Form already generating, skipping autostart');
              return;
            }
            
            // Force update the form one more time to ensure segment is correct
            form.setValue('segment', contactData.category);
            const formData = form.getValues();
            console.log('📋 Form data for autostart:', formData);
            console.log('🎯 Final segment value:', formData.segment);
            onSubmit(formData);
          } catch (autoStartError) {
            console.error('❌ Error in autostart submission:', autoStartError);
            toast({
              title: "Error in auto-generation",
              description: "Failed to automatically start generation. Please try manually.",
              variant: "destructive",
            });
          }
        }, 200); // Increased delay to ensure form is fully populated
      }
    } catch (error) {
      console.error('❌ Error loading contact:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        contactId,
        userId: user?.id
      });
      toast({
        title: "Error loading contact",
        description: `There was an error loading the contact: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoadingContact(false);
    }
  };

  // Smart outreach type detection based on multiple factors
  const determineOutreachType = (contact: Contact): 'cold' | 'warm' | 'follow_up' => {
    // Priority 1: Check relationship status (new field) or legacy status
    const status = contact.relationshipStatus || contact.status;
    
    // Won/Active clients → Follow-up
    if (status === 'won' || status === 'current_client' || status === 'active' || 
        status === 'current_amplifier' || status === 'preferred') {
      return 'follow_up';
    }
    
    // Hot leads or trusted relationships → Warm
    if (status === 'hot' || status === 'warm' || status === 'trusted' || status === 'connected') {
      return 'warm';
    }
    
    // Priority 2: Check relationship intent
    const relationshipType = contact.relationshipType?.toLowerCase() || '';
    const relationshipIntent = contact.relationshipIntent;
    
    // Business nurture relationships → Warm or Follow-up
    if (relationshipIntent === 'business_nurture_statuses') {
      if (status === 'past_client' || status === 'past_donor') {
        return 'warm'; // Re-engagement
      }
      return 'follow_up'; // Active nurture
    }
    
    // Personal relationships → Warm
    if (relationshipIntent === 'personal_statuses') {
      return 'warm';
    }
    
    // Priority 3: Check response history
    if (contact.responseReceived || contact.totalTouchpoints > 3) {
      return 'warm';
    }
    
    // Priority 4: Analyze relationship type name
    if (relationshipType.includes('client') || 
        relationshipType.includes('partner') || 
        relationshipType.includes('friend') ||
        relationshipType.includes('circle') ||
        relationshipType.includes('amplifier')) {
      return 'warm';
    }
    
    // Priority 5: Cold status explicitly
    if (status === 'cold' || status === 'new' || status === 'potential' || 
        status === 'lost_maybe_later' || status === 'lost_not_fit') {
      return 'cold';
    }
    
    // Default for true cold leads
    if (relationshipType.includes('lead') || relationshipType.includes('prospect')) {
      return status === 'cold' ? 'cold' : 'warm';
    }
    
    // Final fallback: warm (safer default for established contacts)
    return contact.totalTouchpoints > 0 ? 'warm' : 'cold';
  };

  const populateFormFromContact = (contact: Contact, channel: 'email' | 'linkedin' | null) => {
    // Map contact category to segment - keep as category value for form compatibility
    const segment = contact.category || 'other';
    console.log('🏷️ Contact category mapping:', { contactCategory: contact.category, mappedSegment: segment });
    
    // Use smart detection based on multiple factors
    const outreachType = determineOutreachType(contact);
    console.log('🎯 Detected outreach type:', outreachType, {
      status: contact.relationshipStatus || contact.status,
      relationshipType: contact.relationshipType,
      relationshipIntent: contact.relationshipIntent,
      responseReceived: contact.responseReceived,
      totalTouchpoints: contact.totalTouchpoints
    });
    
    // Set channel
    const selectedChannel = channel || 'email';
    
    // Build personalization tokens - prioritize contact name
    const tokens = [
      contact.name && `CONTACT NAME: ${contact.name}`,
      contact.company && `Company: ${contact.company}`,
      contact.position && `Position: ${contact.position}`,
      contact.category && `Industry/Category: ${contact.category.replace('_', ' ')}`,
      contact.relationshipType && `Relationship: ${contact.relationshipType.replace('_', ' ')}`,
      contact.source && `Source: ${contact.source}`,
      contact.notes && `Notes: ${contact.notes}`,
    ].filter(Boolean).join('\n');

    // Determine tone and goals based on detected outreach type
    let tone: 'professional' | 'casual' | 'urgent' | 'friendly' = 'professional';
    let contextualGoals = '';
    const status = contact.relationshipStatus || contact.status;
    
    switch (outreachType) {
      case 'follow_up':
        tone = 'friendly';
        contextualGoals = `Follow up with ${contact.name}. Maintain relationship, explore additional opportunities, and seek feedback/referrals.`;
        break;
      case 'warm':
        tone = contact.relationshipIntent === 'personal_statuses' ? 'friendly' : 'professional';
        contextualGoals = `Continue conversation with ${contact.name}. Build on existing relationship and move toward next steps.`;
        break;
      case 'cold':
      default:
        tone = 'professional';
        contextualGoals = `Introduce services to ${contact.name}. Establish credibility and spark interest in next conversation.`;
        break;
    }
    
    // Add status-specific context
    if (status === 'hot') {
      contextualGoals += ' HIGH PRIORITY: Contact is highly engaged and ready to move forward.';
      tone = 'professional';
    }

    // Suggest psychological levers based on category
    const suggestedLevers = [];
    if (contact.category === 'corporate_planner') {
      suggestedLevers.push('efficiency', 'professionalism');
    } else if (contact.category === 'wedding_planner') {
      suggestedLevers.push('exclusivity', 'emotional_connection');
    } else if (contact.category === 'venue') {
      suggestedLevers.push('partnership', 'mutual_benefit');
    }

    console.log('📋 Resetting form with values:', { outreachType, segment, tone, channel: selectedChannel, contactName: contact.name });
    form.reset({
      outreachType: outreachType as 'cold' | 'warm' | 'follow_up',
      segment,
      goals: contextualGoals,
      tone,
      psychologicalLevers: suggestedLevers,
      channel: selectedChannel,
      sequenceStep: 1,
      length: 'medium',
      holidayEdition: false,
      proofAssets: [],
      personalizationTokens: tokens,
      contactName: contact.name || '',
      offerIncentive: '',
    });
    
    // Force update the segment field to ensure it's properly set
    form.setValue('segment', segment);
    form.setValue('contactName', contact.name || '');
    console.log('✅ Form segment field set to:', segment);
    console.log('✅ Form contactName field set to:', contact.name);
  };

  const clearContact = () => {
    setSelectedContact(null);
    // Clear the contact name field when clearing contact
    form.setValue('contactName', '');
    // Update URL to remove contact parameters
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('contactId');
    newUrl.searchParams.delete('channel');
    newUrl.searchParams.delete('autostart');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const watchedValues = form.watch();
  const completedFields = Object.values(watchedValues).filter(Boolean).length;
  const totalFields = Object.keys(watchedValues).length;
  const progress = Math.round((completedFields / totalFields) * 100);

  const onSubmit = async (data: OutreachRequest) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate outreach content.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Determine outreach type from contact if available
      const outreachType = selectedContact ? determineOutreachType(selectedContact) : data.outreachType;
      
      // Enhance the request with contact context and relationship data
      const enhancedData = {
        ...data,
        contactId: selectedContact?.id || null,
        campaignId: selectedCampaignId && selectedCampaignId !== 'none' ? selectedCampaignId : null,
        contactSpecificGoal: data.contactSpecificGoal || null,
        // Add relationship status and contexts for enhanced personalization
        contactRelationshipStatus: selectedContact?.relationshipStatus || selectedContact?.status || null,
        contactContexts: selectedContact?.id ? 
          contexts.filter(context => 
            // This would be populated by a proper context assignment check
            // For now, we pass all available contexts for the AI to consider
            context
          ).map(context => ({
            name: context.name,
            label: context.label
          })) : [],
        // Enhanced relationship information
        contactRelationshipType: selectedContact?.relationshipType || null,
        contactRelationshipIntent: selectedContact?.relationshipIntent || null,
        relationshipTypeData: selectedContact?.relationshipType ? 
          relationshipTypes.find(rt => rt.name === selectedContact.relationshipType) : null,
        contactName: selectedContact?.name || null,
        outreachType: outreachType, // Pass the detected outreach type
      };

      const { data: result, error } = await supabase.functions.invoke('generate-outreach', {
        body: enhancedData,
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!result) {
        throw new Error('No content generated');
      }

      setGeneratedContent(result);
      // Reset edited content and editing states when new content is generated
      setEditedContent(null);
      setIsEditingEmail(false);
      setIsEditingEmailSubject(false);
      setIsEditingLinkedIn(false);
      setIsEditingSocial(false);
      setIsEditingCall(false);
      
      // Log to campaign if campaign is selected
      if (selectedCampaignId && selectedCampaignId !== 'none' && selectedContact?.id) {
        try {
          await logCampaignOutreach.mutateAsync({
            campaignId: selectedCampaignId,
            contactId: selectedContact.id,
            channel: data.channel,
            aiTokensUsed: result.tokensUsed || 0,
            contactSpecificGoal: data.contactSpecificGoal || null,
          });
        } catch (error) {
          console.error('Failed to log campaign outreach:', error);
          // Don't block the user flow if campaign logging fails
        }
      }
      
      // Enhanced success message with research indicator
      const researchUsed = enableResearch && research?.status === 'completed';
      toast({
        title: "🎉 Outreach generated!",
        description: researchUsed ? 
          "Your personalized outreach content is ready with web research insights!" : 
          "Your personalized outreach content is ready.",
      });
    } catch (error) {
      console.error('Error generating outreach:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to generate outreach content. Please try again.";
      if (error.message?.includes('Failed to send a request')) {
        errorMessage = "Network connection failed. Please check your internet and try again.";
      } else if (error.message?.includes('timeout') || error.message?.includes('Load failed')) {
        errorMessage = "Request timed out. The AI is working hard - please try again in a moment.";
      }
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const onBusinessProfileSubmit = async (data: any) => {
    const success = await saveProfile(data);
    if (success) {
      toast({
        title: "✅ Business profile saved",
        description: "Your business information has been updated.",
      });
      setShowBusinessProfile(false);
    } else {
      toast({
        title: "Save failed",
        description: "Failed to save business profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get active content (edited or original)
  const getActiveContent = () => editedContent || generatedContent;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  // Helper function to get current challenge day
  const getCurrentChallengeDay = async (): Promise<number> => {
    try {
      const { data: challengeConfig, error } = await supabase
        .from('challenge_config')
        .select('current_day, start_date')
        .eq('is_active', true)
        .single();

      if (error || !challengeConfig) {
        // Fallback: calculate based on current date (assume start date was 30 days ago)
        const fallbackStartDate = new Date();
        fallbackStartDate.setDate(fallbackStartDate.getDate() - 30);
        const daysDiff = Math.floor((Date.now() - fallbackStartDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, Math.min(daysDiff + 1, 75));
      }

      return challengeConfig.current_day || 1;
    } catch (error) {
      console.error('Error getting challenge day:', error);
      return 1; // Safe fallback
    }
  };

  // Helper function to determine outreach type from form data
  const getOutreachTypeFromForm = (formData: any): string => {
    const outreachType = formData.outreachType || 'cold';
    const relationshipType = selectedContact?.relationshipType;
    
    if (outreachType === 'warm' || relationshipType === 'past_client' || relationshipType === 'friend_family') {
      return 'warm';
    }
    return 'cold'; // Default to cold for new contacts
  };

  // Helper function to log outreach activity  
  const logOutreach = async (channel: 'email' | 'linkedin' | 'social' | 'call', content: string) => {
    if (!user?.id) {
      console.warn('No user ID available for logging outreach');
      return { success: false, error: 'No user ID available' };
    }

    // Phase 2A: Check access before attempting to log
    if (!canWrite) {
      console.error('🔒 [logOutreach] BLOCKED - No write access');
      return { success: false, error: 'You need an active subscription to log touchpoints' };
    }

    try {
      const challengeDay = await getCurrentChallengeDay();
      const formData = form.getValues();
      const outreachType = getOutreachTypeFromForm(formData);
      
      // Determine the social media type based on channel
      const isSocialMedia = channel === 'linkedin';
      
      // Log metrics to user_metrics table
      const metricsToLog = [];
      
      if (outreachType === 'cold') {
        metricsToLog.push({
          user_id: user.id,
          challenge_day: challengeDay,
          metric_name: 'cold_outreach',
          metric_type: 'daily_outreach',
          value: 1,
          unit: 'count',
          notes: `${channel} outreach to ${selectedContact?.name || 'contact'}`
        });
      } else if (outreachType === 'warm') {
        metricsToLog.push({
          user_id: user.id,
          challenge_day: challengeDay,
          metric_name: 'warm_outreach', 
          metric_type: 'daily_outreach',
          value: 1,
          unit: 'count',
          notes: `${channel} outreach to ${selectedContact?.name || 'contact'}`
        });
      }

      if (isSocialMedia) {
        metricsToLog.push({
          user_id: user.id,
          challenge_day: challengeDay,
          metric_name: 'social_outreach',
          metric_type: 'daily_outreach', 
          value: 1,
          unit: 'count',
          notes: `${channel} outreach to ${selectedContact?.name || 'contact'}`
        });
      }

      // Insert metrics (this should always work due to RLS policies)
      for (const metric of metricsToLog) {
        try {
          const { error: metricError } = await supabase
            .from('user_metrics')
            .insert(metric);
          
          if (metricError) {
            console.error('Error logging metric:', metricError);
            // Continue with other metrics even if one fails
          }
        } catch (err) {
          console.error('Error inserting metric:', err);
          // Continue with other metrics
        }
      }

      // Use saveActivity from useCRMData for consistent touchpoint tracking
      if (selectedContact?.id) {
        try {
          // Map channel to valid TouchpointType
          const activityType = channel === 'linkedin' ? 'linkedin' : 'email';
          
          await saveActivity({
            contactId: selectedContact.id,
            type: activityType,
            title: `${channel.charAt(0).toUpperCase() + channel.slice(1)} outreach sent`,
            description: `Sent ${outreachType} outreach via ${channel}${selectedContact.name ? ` to ${selectedContact.name}` : ''}`,
            messageContent: content,
            responseReceived: false,
            createdAt: new Date(),
            completedAt: new Date()
          });
          
          console.log('✅ [logOutreach] Activity logged successfully via saveActivity');
        } catch (err) {
          // Phase 2B: Propagate errors instead of swallowing them
          const errorMessage = err instanceof Error ? err.message : 'Unknown error creating activity';
          console.error('❌ [logOutreach] Error creating activity via saveActivity:', err);
          return { success: false, error: errorMessage };
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error logging outreach';
      console.error('❌ [logOutreach] Error logging outreach:', error);
      return { success: false, error: errorMessage };
    }
  };

  const copyAndLogOutreach = async (content: string, type: string, channel: 'email' | 'linkedin' | 'social' | 'call') => {
    // First copy to clipboard
    try {
      await navigator.clipboard.writeText(content);
      
      // Then log the outreach
      const result = await logOutreach(channel, content);
      
      // Phase 2C: Fix toast logic to properly handle failures
      if (result.success) {
        toast({
          title: `${type} copied & outreach logged!`,
          description: `Copied to clipboard and logged as sent ${channel} outreach.`,
        });
      } else {
        // Show descriptive error when logging fails
        toast({
          title: `${type} copied, but logging failed`,
          description: result.error || "Unable to log outreach. Please check your subscription status or try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Copy failed", 
        description: "Unable to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while auth or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI Outreach...</p>
        </div>
      </div>
    );
  }

  if (showBusinessProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBusinessProfile(false)}
              className="hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AI Outreach
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Business Setup</span>
            </div>
          </div>

          <Card className="bg-gradient-card border-0 shadow-elevated animate-scale-in">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Business Profile</CardTitle>
              <p className="text-muted-foreground">
                Help AI generate more personalized and effective outreach by sharing your business details
              </p>
            </CardHeader>
            <CardContent>
              <Form {...businessForm}>
                <form onSubmit={businessForm.handleSubmit(onBusinessProfileSubmit)} className="space-y-6">
                  <FormField
                    control={businessForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span>Business Name</span>
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                           <Input 
                             placeholder="e.g., Mobile Bev Pros" 
                             className="h-12 focus:ring-2 focus:ring-primary/20 transition-all"
                             tabIndex={0}
                             {...field} 
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="valueProp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Proposition</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Premium mobile bar services with turn-key setup, professional bartenders, and comprehensive liability coverage"
                            className="min-h-[100px] focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            tabIndex={0}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          What makes your business unique and valuable to clients?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={businessForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                             <Input 
                               placeholder="e.g., Mobile Bar Services"
                               className="h-12 focus:ring-2 focus:ring-primary/20 transition-all"
                               tabIndex={0}
                               {...field} 
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessForm.control}
                      name="targetMarket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Market</FormLabel>
                          <FormControl>
                             <Input 
                               placeholder="e.g., Event planners, corporate clients, venues"
                               className="h-12 focus:ring-2 focus:ring-primary/20 transition-all"
                               tabIndex={0}
                               {...field} 
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={businessForm.control}
                    name="keyDifferentiators"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Differentiators</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Insured, TIPS-certified bartenders, custom branding options, 24-hour response time"
                            className="min-h-[100px] focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            tabIndex={0}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          What sets you apart from competitors?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit" 
                      className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105 shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      Save Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBusinessProfile(false)}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Contact Banner */}
      {selectedContact && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <div>
                <p className="font-medium">Generating outreach for:</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.name}
                    {selectedContact.company && ` • ${selectedContact.company}`}
                    {selectedContact.position && ` • ${selectedContact.position}`}
                  </p>
                  <Badge variant={
                    determineOutreachType(selectedContact) === 'cold' ? 'secondary' : 
                    determineOutreachType(selectedContact) === 'warm' ? 'default' : 'outline'
                  } className="ml-2">
                    {determineOutreachType(selectedContact) === 'cold' ? '❄️ Cold Outreach' : 
                     determineOutreachType(selectedContact) === 'warm' ? '🤝 Warm Outreach' : '✅ Follow-up'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearContact}>
              Clear Contact
            </Button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Check if we have a returnTo parameter in URL
                const urlParams = new URLSearchParams(location.search);
                const returnTo = urlParams.get('returnTo');
                
                if (returnTo) {
                  navigate(returnTo);
                } else if (selectedContact) {
                  // Navigate to contacts tab with the selected contact
                  navigate(`/?tab=contacts&contactId=${selectedContact.id}`);
                } else {
                  // Use browser back or default to dashboard
                  navigate(-1);
                }
              }}
              className="hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {selectedContact ? `Back to ${selectedContact.name}` : 'Back to Dashboard'}
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <div>
              <h1 className="text-2xl font-playfair font-bold text-foreground flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-primary-foreground" />
                </div>
                AI Outreach Generator
              </h1>
              <p className="text-muted-foreground text-sm">
                Generate personalized, high-converting outreach scripts powered by AI
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {profile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {profile.businessName}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setShowBusinessProfile(true)}
                className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Business Profile
              </Button>
            </div>
            {!profile && (
              <Badge variant="destructive" className="animate-pulse bg-destructive/90 text-destructive-foreground border-destructive/20 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Business Profile Required
              </Badge>
            )}
          </div>
        </div>

        {/* Status Indicators - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-fade-in">
          {/* Form Completion Progress */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Form Progress</span>
                <span className="text-sm font-semibold text-blue-600">{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2 bg-blue-100 [&>div]:bg-blue-500"
              />
              <p className="text-xs text-blue-700 mt-2">
                {progress === 100 ? '✓ Ready to generate' : 'Complete required fields'}
              </p>
            </CardContent>
          </Card>

          {/* AI Usage Quota */}
          <div className="flex items-stretch">
            <AIQuotaCard />
          </div>
        </div>

        {/* Form */}
        <Card className="bg-gradient-card border-0 shadow-elevated animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Outreach Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure your outreach parameters for maximum impact
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Basic Settings
                    </h3>
                    
                    {/* Contact Name Field */}
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Contact Name
                            <Badge variant="secondary" className="text-xs">For Personalization</Badge>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter the contact's name for personalized messaging..."
                              className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </FormControl>
                          <FormDescription>
                            This name will be used throughout your outreach for personalization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Campaign Initiative Field */}
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Campaign Initiative (Optional)
                      </FormLabel>
                      <Select onValueChange={setSelectedCampaignId} value={selectedCampaignId}>
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                            <SelectValue placeholder="No campaign (general outreach)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                          <SelectItem value="none">No Campaign</SelectItem>
                          {activeCampaigns?.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{campaign.name}</span>
                                {campaign.event_date && (
                                  <span className="text-xs text-muted-foreground">
                                    ({format(new Date(campaign.event_date), 'MMM d, yyyy')})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a campaign to include its context in AI generation
                      </FormDescription>
                    </FormItem>

                    {/* Contact-Specific Goal Field (shown when campaign is selected) */}
                    {selectedCampaignId && selectedCampaignId !== 'none' && (
                      <FormField
                        control={form.control}
                        name="contactSpecificGoal"
                        render={({ field }) => (
                          <FormItem className="animate-fade-in">
                            <FormLabel>Goal for {selectedContact?.name || 'this contact'}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Attend the conference, Sponsor at Gold tier, Refer other bar operators"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              What specific action do you want this contact to take? (This will tailor the AI-generated copy)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                    )}

                    {/* Campaign Context Banner */}
                    {selectedCampaignId && selectedCampaignId !== 'none' && activeCampaigns && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <Calendar className="w-5 h-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {activeCampaigns.find(c => c.id === selectedCampaignId)?.name}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activeCampaigns.find(c => c.id === selectedCampaignId)?.campaign_goal}
                                </p>
                                {activeCampaigns.find(c => c.id === selectedCampaignId)?.event_date && (
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(activeCampaigns.find(c => c.id === selectedCampaignId)!.event_date!), 'MMMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Override settings</span>
                              <Switch 
                                checked={overrideCampaignSettings}
                                onCheckedChange={setOverrideCampaignSettings}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="outreachType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Outreach Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                                <SelectItem value="cold">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span>❄️</span>
                                      <span className="font-medium">Cold Outreach</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">First contact with someone you don't know</p>
                                  </div>
                                </SelectItem>
                                <SelectItem value="warm">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span>🔥</span>
                                      <span className="font-medium">Warm Outreach</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Reaching out to existing connections or referrals</p>
                                  </div>
                                </SelectItem>
                                <SelectItem value="follow_up">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span>📞</span>
                                      <span className="font-medium">Follow-up</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Continuing conversation with previous contacts</p>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose based on your relationship with the contact
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="channel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Channel</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl>
                                 <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                   <SelectValue />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                                 <SelectItem value="email">
                                   <div className="space-y-1">
                                     <div className="flex items-center gap-2">
                                       <Mail className="w-4 h-4" />
                                       <span className="font-medium">Email</span>
                                     </div>
                                     <p className="text-xs text-muted-foreground">Professional email outreach with full message</p>
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="linkedin">
                                   <div className="space-y-1">
                                     <div className="flex items-center gap-2">
                                       <Linkedin className="w-4 h-4" />
                                       <span className="font-medium">LinkedIn</span>
                                     </div>
                                     <p className="text-xs text-muted-foreground">Professional networking messages and connection requests</p>
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="social">
                                   <div className="space-y-1">
                                     <div className="flex items-center gap-2">
                                       <span>📱</span>
                                       <span className="font-medium">Social Media</span>
                                     </div>
                                     <p className="text-xs text-muted-foreground">Instagram DMs, Facebook messages, or platform comments</p>
                                   </div>
                                 </SelectItem>
                               </SelectContent>
                             </Select>
                            <FormDescription>
                              Where you plan to send your outreach message
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="segment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Target Segment
                              {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                                <Badge variant="secondary" className="text-xs">
                                  From campaign
                                </Badge>
                              )}
                            </FormLabel>
                             <Select 
                               onValueChange={field.onChange} 
                               value={field.value}
                               disabled={selectedCampaignId !== 'none' && !overrideCampaignSettings}
                             >
                               <FormControl>
                                 <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                   <SelectValue />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated max-h-[300px] z-50">
                                 {categories.map((category) => (
                                   <SelectItem key={category.name} value={category.name}>
                                     <div className="flex items-center gap-2">
                                       {category.iconName && (
                                         <span className="w-4 h-4 text-xs">
                                           {category.iconName === 'Building' ? '🏢' : 
                                            category.iconName === 'Users' ? '👥' : 
                                            category.iconName === 'MapPin' ? '📍' : 
                                            category.iconName === 'Calendar' ? '📅' : '📁'}
                                         </span>
                                       )}
                                       {category.label}
                                     </div>
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                             {form.watch('segment') && categories.find(cat => cat.name === form.watch('segment')) && (
                               <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
                                 <p className="text-xs text-muted-foreground flex items-center gap-2">
                                   <Lightbulb className="w-3 h-3" />
                                   <strong>Category:</strong> {categories.find(cat => cat.name === form.watch('segment'))?.label}
                                 </p>
                               </div>
                             )}
                             {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                               <FormDescription className="text-primary/80 flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" />
                                 Using segment from campaign settings
                               </FormDescription>
                             )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="goals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Specific Goals
                              {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                                <Badge variant="secondary" className="text-xs">
                                  From campaign
                                </Badge>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., Book holiday parties, get referrals, schedule discovery calls..."
                                className="min-h-[100px] border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                tabIndex={0}
                                disabled={selectedCampaignId !== 'none' && !overrideCampaignSettings}
                                {...field} 
                              />
                            </FormControl>
                            {selectedCampaignId !== 'none' && !overrideCampaignSettings ? (
                              <FormDescription className="text-primary/80 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Using goals from campaign settings
                              </FormDescription>
                            ) : (
                              <FormDescription>
                                What specific outcomes do you want from this outreach?
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Style & Tone */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Style & Tone
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Tone
                              {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                                <Badge variant="secondary" className="text-xs">
                                  From campaign
                                </Badge>
                              )}
                            </FormLabel>
                             <Select 
                               onValueChange={field.onChange} 
                               value={field.value}
                               disabled={selectedCampaignId !== 'none' && !overrideCampaignSettings}
                             >
                               <FormControl>
                                 <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                   <SelectValue />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                                 <SelectItem value="professional">👔 Professional</SelectItem>
                                 <SelectItem value="casual">😊 Casual</SelectItem>
                                 <SelectItem value="urgent">🚨 Urgent</SelectItem>
                                 <SelectItem value="friendly">🤝 Friendly</SelectItem>
                               </SelectContent>
                             </Select>
                             {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                               <FormDescription className="text-primary/80 flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" />
                                 Using tone from campaign
                               </FormDescription>
                             )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl>
                                 <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                   <SelectValue />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                                 <SelectItem value="short">📝 Short (50-100 words)</SelectItem>
                                 <SelectItem value="medium">📄 Medium (100-200 words)</SelectItem>
                                 <SelectItem value="long">📋 Long (200+ words)</SelectItem>
                               </SelectContent>
                             </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Buyer Motivation Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          🎯 Buyer Motivation
                          <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          If you know what drives this person or what concerns them, we can tailor the message to resonate better.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="coreDesire"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What does this person want most?</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select their primary goal..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not_sure">Not sure (appeal to all motivations)</SelectItem>
                                  <SelectItem value="breakthrough">🚀 Break through to the next level</SelectItem>
                                  <SelectItem value="relationships">🤝 Build strong relationships and partnerships</SelectItem>
                                  <SelectItem value="informed_decisions">📊 Make informed, confident decisions</SelectItem>
                                  <SelectItem value="achieve_goals">🎯 Achieve specific goals and targets</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                This helps us emphasize the right benefits and outcomes.
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="coreFear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What concern keeps them up at night?</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select their primary concern..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not_sure">Not sure (address all concerns)</SelectItem>
                                  <SelectItem value="plateauing">📉 Getting stuck or plateauing</SelectItem>
                                  <SelectItem value="missing_connections">🔌 Missing out on key connections</SelectItem>
                                  <SelectItem value="wrong_choice">⚠️ Choosing the wrong option</SelectItem>
                                  <SelectItem value="wasting_time">⏱️ Wasting time or falling short</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                This helps us address the right pain points and objections.
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Call to Action */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Call to Action
                    </h3>

                    <FormField
                      control={form.control}
                      name="callToAction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Preferred CTA (Optional)
                            {selectedCampaignId !== 'none' && !overrideCampaignSettings && (
                              <Badge variant="secondary" className="text-xs">
                                From campaign
                              </Badge>
                            )}
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || "ai_choose"}
                            disabled={selectedCampaignId !== 'none' && !overrideCampaignSettings}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" tabIndex={0}>
                                <SelectValue placeholder="Let AI choose the best CTA" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover/95 backdrop-blur-sm border shadow-elevated z-50">
                              <SelectItem value="ai_choose">Let AI choose</SelectItem>
                              <SelectItem value="schedule_call">📞 Schedule a call</SelectItem>
                              <SelectItem value="book_consultation">📅 Book a consultation</SelectItem>
                              <SelectItem value="request_quote">💰 Request a quote</SelectItem>
                              <SelectItem value="view_portfolio">📸 View our portfolio</SelectItem>
                              <SelectItem value="schedule_tasting">🍸 Schedule a tasting</SelectItem>
                              <SelectItem value="connect_linkedin">🤝 Connect on LinkedIn</SelectItem>
                              <SelectItem value="reply_email">✉️ Reply to this email</SelectItem>
                              <SelectItem value="visit_website">🌐 Visit our website</SelectItem>
                              <SelectItem value="follow_up">📞 Let's follow up soon</SelectItem>
                              <SelectItem value="custom">✏️ Custom (AI will adapt)</SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedCampaignId !== 'none' && !overrideCampaignSettings ? (
                            <FormDescription className="text-primary/80 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Using call to action from campaign
                            </FormDescription>
                          ) : (
                            <FormDescription>
                              Choose a specific call to action or let the AI select the best one
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Psychology & Proof */}
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Psychology & Proof
                      </h3>

                      <FormField
                        control={form.control}
                        name="psychologicalLevers"
                        render={() => (
                          <FormItem>
                            <FormLabel>Psychological Levers</FormLabel>
                            <FormDescription className="text-xs">
                              Select the psychological triggers that resonate with your audience
                            </FormDescription>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {PSYCHOLOGICAL_LEVERS.map((lever) => (
                                <FormField
                                  key={lever.value}
                                  control={form.control}
                                  name="psychologicalLevers"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={lever.value}
                                        className="flex flex-row items-start space-x-2 space-y-0 p-2 rounded-md border bg-background/50 hover:bg-background/80 transition-colors"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(lever.value)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, lever.value])
                                                : field.onChange(
                                                    field.value?.filter((value) => value !== lever.value)
                                                  );
                                            }}
                                            className="mt-0.5"
                                          />
                                        </FormControl>
                                        <div className="space-y-0.5 leading-tight flex-1">
                                          <FormLabel className="text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                                            <span className="text-sm">{lever.icon}</span>
                                            <span className="line-clamp-1">{lever.value}</span>
                                          </FormLabel>
                                          <p className="text-xs text-muted-foreground line-clamp-2">
                                            {lever.description}
                                          </p>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Advanced Options */}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-between w-full p-0 h-auto font-medium"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Advanced Options
                        </span>
                        {showAdvanced ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sequenceStep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sequence Step</FormLabel>
                              <FormControl>
                                 <Input 
                                   type="number" 
                                   min="1" 
                                   max="10"
                                   className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                   tabIndex={0}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>Which step in your outreach sequence?</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="holidayEdition"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  🎄 Holiday Edition
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Include seasonal messaging
                                </div>
                              </div>
                              <FormControl>
                               <Switch
                                 checked={field.value}
                                 onCheckedChange={field.onChange}
                                 tabIndex={0}
                               />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="personalizationTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personalization Details</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., Recent Instagram post about event planning, mentioned needing bar services, saw their venue featured in Style Weekly..."
                                className="min-h-[80px] border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                tabIndex={0}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Any specific details you can reference to personalize the message
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                       <FormField
                         control={form.control}
                         name="offerIncentive"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Offer/Incentive (Optional)</FormLabel>
                             <FormControl>
                                <Input 
                                  placeholder="e.g., 10% off holiday bookings, free tasting for events over 50 people..."
                                  className="h-12 border-2 border-input/60 bg-background/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                  tabIndex={0}
                                  {...field} 
                                />
                             </FormControl>
                             <FormDescription>
                               Special offer or incentive to include in the outreach
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />

                         {/* Web Research (Firecrawl) Section */}
                          <WebResearchSection 
                            selectedContact={selectedContact}
                            enableResearch={enableResearch}
                            onEnableChange={setEnableResearch}
                            research={research}
                            isResearchLoading={isResearchLoading}
                            isStartingResearch={isStartingResearch}
                            startResearch={startResearch}
                            canAffordResearch={canAffordResearch}
                            quotaInfo={quotaInfo}
                            onSaveUrls={persistUrls}
                          />
                    </CollapsibleContent>
                  </Collapsible>

                  <Button 
                    type="submit" 
                    disabled={generating || !profile} 
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-[1.02] text-lg font-medium shadow-md"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                        Generating your outreach...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-3" />
                        Generate AI Outreach
                      </>
                    )}
                  </Button>

                  {!profile && (
                    <div className="text-center text-sm text-destructive-foreground bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                      <AlertTriangle className="w-4 h-4 mx-auto mb-2 text-destructive" />
                      Complete your business profile above to unlock AI generation
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-gradient-card border-0 shadow-elevated animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Generated Content
                {enableResearch && research?.status === 'completed' && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Research Used
                  </Badge>
                )}
              </CardTitle>
              {generatedContent && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="animate-fade-in">
                    {generatedContent.keyAngle}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={generating}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Configure your outreach parameters and click "Generate AI Outreach" to get started.
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                      <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </TabsTrigger>
                      <TabsTrigger value="social" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Social
                      </TabsTrigger>
                      <TabsTrigger value="call" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Call Script
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="space-y-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Subject Line
                            {editedContent && editedContent.subjectLine !== generatedContent?.subjectLine && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </label>
                          <div className="flex gap-2">
                            {!isEditingEmailSubject && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingEmailSubject(true)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {isEditingEmailSubject && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingEmailSubject(false)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(getActiveContent()?.subjectLine || '', "Subject line")}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {isEditingEmailSubject ? (
                          <Input
                            value={editedContent?.subjectLine || generatedContent?.subjectLine || ''}
                            onChange={(e) => setEditedContent(prev => ({
                              ...(prev || generatedContent!),
                              subjectLine: e.target.value
                            }))}
                            className="font-medium"
                          />
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-sm font-medium">{getActiveContent()?.subjectLine}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Email Body
                            {editedContent && editedContent.emailBody !== generatedContent?.emailBody && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </label>
                          <div className="flex gap-2">
                            {!isEditingEmail && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingEmail(true)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {isEditingEmail && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingEmail(false)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(getActiveContent()?.emailBody || '', "Email body")}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                const subject = encodeURIComponent(activeContent?.subjectLine || '');
                                const body = encodeURIComponent(activeContent?.emailBody || '');
                                const email = selectedContact?.email || '';
                                const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
                                window.open(mailtoLink, '_blank');
                              }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Open Email Draft
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyAndLogOutreach(
                                  `${activeContent?.subjectLine || ''}\n\n${activeContent?.emailBody || ''}`, 
                                  "Email", 
                                  "email"
                                );
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy & Log as Sent
                            </Button>
                          </div>
                        </div>
                        {isEditingEmail ? (
                          <Textarea
                            value={editedContent?.emailBody || generatedContent?.emailBody || ''}
                            onChange={(e) => setEditedContent(prev => ({
                              ...(prev || generatedContent!),
                              emailBody: e.target.value
                            }))}
                            className="min-h-[320px] font-sans"
                          />
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-lg border max-h-80 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                              {getActiveContent()?.emailBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="linkedin" className="space-y-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn Message
                            {editedContent && editedContent.linkedinMessage !== generatedContent?.linkedinMessage && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </label>
                          <div className="flex gap-2">
                            {!isEditingLinkedIn && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingLinkedIn(true)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {isEditingLinkedIn && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingLinkedIn(false)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(getActiveContent()?.linkedinMessage || '', "LinkedIn message")}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const linkedinUrl = selectedContact?.linkedinUrl;
                                if (linkedinUrl) {
                                  window.open(linkedinUrl, '_blank');
                                  toast({
                                    title: "LinkedIn opened",
                                    description: "Copy the message and send it on LinkedIn. Don't forget to log the activity!",
                                  });
                                } else {
                                  toast({
                                    title: "No LinkedIn URL",
                                    description: "This contact doesn't have a LinkedIn URL saved.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Linkedin className="w-3 h-3 mr-1" />
                              Open LinkedIn
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyAndLogOutreach(activeContent?.linkedinMessage || '', "LinkedIn Message", "linkedin");
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy & Log as Sent
                            </Button>
                          </div>
                        </div>
                        {isEditingLinkedIn ? (
                          <Textarea
                            value={editedContent?.linkedinMessage || generatedContent?.linkedinMessage || ''}
                            onChange={(e) => setEditedContent(prev => ({
                              ...(prev || generatedContent!),
                              linkedinMessage: e.target.value
                            }))}
                            className="min-h-[320px] font-sans"
                          />
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-lg border max-h-80 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                              {getActiveContent()?.linkedinMessage}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Social Media Post
                            {editedContent && (editedContent.socialMediaPost || editedContent.linkedinMessage) !== (generatedContent?.socialMediaPost || generatedContent?.linkedinMessage) && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </label>
                          <div className="flex gap-2">
                            {!isEditingSocial && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingSocial(true)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {isEditingSocial && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingSocial(false)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyToClipboard(activeContent?.socialMediaPost || activeContent?.linkedinMessage || '', "Social media post");
                              }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyAndLogOutreach(
                                  activeContent?.socialMediaPost || activeContent?.linkedinMessage || '', 
                                  "Social Media Post", 
                                  "social"
                                );
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy & Log as Sent
                            </Button>
                          </div>
                        </div>
                        {isEditingSocial ? (
                          <Textarea
                            value={editedContent?.socialMediaPost || editedContent?.linkedinMessage || generatedContent?.socialMediaPost || generatedContent?.linkedinMessage || ''}
                            onChange={(e) => setEditedContent(prev => ({
                              ...(prev || generatedContent!),
                              socialMediaPost: e.target.value
                            }))}
                            className="min-h-[320px] font-sans"
                          />
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-lg border max-h-80 overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                              {getActiveContent()?.socialMediaPost || getActiveContent()?.linkedinMessage}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="call" className="space-y-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Call Script & Talking Points
                            {editedContent && (editedContent.callScript || editedContent.linkedinMessage) !== (generatedContent?.callScript || generatedContent?.linkedinMessage) && (
                              <Badge variant="secondary" className="ml-2">
                                <Edit className="w-3 h-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </label>
                          <div className="flex gap-2">
                            {!isEditingCall && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingCall(true)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {isEditingCall && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingCall(false)}
                                className="hover:bg-muted/50 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyToClipboard(activeContent?.callScript || activeContent?.linkedinMessage || '', "Call script");
                              }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const activeContent = getActiveContent();
                                copyAndLogOutreach(
                                  activeContent?.callScript || activeContent?.linkedinMessage || '', 
                                  "Call Script", 
                                  "call"
                                );
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy & Log as Sent
                            </Button>
                          </div>
                        </div>
                        {isEditingCall ? (
                          <Textarea
                            value={editedContent?.callScript || editedContent?.linkedinMessage || generatedContent?.callScript || generatedContent?.linkedinMessage || ''}
                            onChange={(e) => setEditedContent(prev => ({
                              ...(prev || generatedContent!),
                              callScript: e.target.value
                            }))}
                            className="min-h-[320px] font-sans"
                          />
                        ) : (
                          <div className="p-4 bg-muted/30 rounded-lg border max-h-80 overflow-y-auto">
                            <div className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                              {(() => {
                                const activeContent = getActiveContent();
                                const callScript = activeContent?.callScript || activeContent?.linkedinMessage || '';
                                
                                if (activeContent?.callScript) {
                                  return (
                                    <div className="space-y-4">
                                      {callScript.split('\n\n').map((section, index) => {
                                        if (section.includes('KEY POINTS:') || section.includes('TALKING POINTS:') || section.includes('•')) {
                                          return (
                                            <div key={index} className="bg-accent/20 p-3 rounded border-l-4 border-accent">
                                              <div className="font-medium text-accent-foreground mb-2 flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4" />
                                                Key Talking Points
                                              </div>
                                              <div className="text-sm">{section}</div>
                                            </div>
                                          );
                                        }
                                        return <div key={index}>{section}</div>;
                                      })}
                                    </div>
                                  );
                                }
                                return callScript;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        
        {/* Token Usage Insights - Bottom of page */}
        <div className="mt-8">
          <TokenBreakdownCard inputText={(watchedValues.goals || '') + ' ' + (watchedValues.personalizationTokens || '')} />
        </div>
      </div>
    </div>
  );
}