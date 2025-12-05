import React, { useState, useEffect, useMemo } from 'react';
import { Contact, Activity, CRMStats, TouchpointType, LeadStatus, RelationshipType, RelationshipIntent, ContactCategory, ContactContextData } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { computeNextFollowUp } from '@/utils/followUpCadence';
import { isDemoContact, logDemoContactExclusion } from '@/utils/demoContactUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCRMSettings } from './useCRMSettings';
import { useGamificationActions } from './useGamificationActions';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isPast, startOfDay } from 'date-fns';

// Mock data for demo mode
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.com",
    company: "TechCorp Solutions", 
    position: "Marketing Director",
    phone: "+1 (555) 123-4567",
    linkedinUrl: "https://linkedin.com/in/sarahjohnson",
    status: "warm",
    relationshipType: "cold_lead",
    category: "corporate_planner",
    source: "LinkedIn Outreach",
    createdAt: new Date("2024-01-15"),
    lastContactDate: new Date("2024-01-20"),
    nextFollowUp: new Date("2024-02-01"),
    notes: "Interested in our Q2 campaign. Has budget allocated.",
    responseReceived: true,
    totalTouchpoints: 3,
    bookingScheduled: false,
    archived: false,
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "m.chen@innovate.io",
    company: "Innovate.io",
    position: "CEO",
    status: "hot",
    relationshipType: "referral",
    category: "venue",
    source: "Website Contact Form",
    createdAt: new Date("2024-01-18"),
    lastContactDate: new Date("2024-01-22"),
    nextFollowUp: new Date("2024-01-25"),
    notes: "Ready to move forward. Scheduled demo for next week.",
    responseReceived: true,
    totalTouchpoints: 5,
    bookingScheduled: true,
    archived: false,
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    email: "emma@creativestudio.com", 
    company: "Creative Studio",
    position: "Event Coordinator",
    phone: "+1 (555) 987-6543",
    linkedinUrl: "https://linkedin.com/in/emmarodriguez",
    status: "cold",
    relationshipType: "cold_lead",
    category: "wedding_planner",
    source: "Industry Conference",
    createdAt: new Date("2024-01-10"),
    lastContactDate: new Date("2024-01-12"),
    nextFollowUp: new Date("2024-01-30"),
    notes: "Met at the conference. Interested but needs more information.",
    responseReceived: false,
    totalTouchpoints: 2,
    bookingScheduled: false,
    archived: false,
  }
];

const mockActivities: Activity[] = [
  {
    id: "1",
    contactId: "1",
    type: "email",
    title: "Initial Outreach Email",
    description: "Sent introduction email about our services",
    responseReceived: true,
    completedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    contactId: "1",
    type: "call",
    title: "Follow-up Call",
    description: "Called to discuss project requirements and timeline",
    responseReceived: true,
    scheduledFor: new Date("2024-01-20"),
    completedAt: new Date("2024-01-20"),
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    contactId: "2",
    type: "meeting",
    title: "Project Demo Meeting",
    description: "Scheduled virtual meeting to demonstrate capabilities",
    responseReceived: false,
    scheduledFor: new Date("2024-01-25"),
    createdAt: new Date("2024-01-22"),
  }
];

// Fetch CRM data from Supabase
const fetchCRMData = async (userId: string) => {
  if (!userId) return { contacts: [], activities: [] };

  try {
    // CRITICAL: Ensure we have a fresh, valid session before querying
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[fetchCRMData] No valid session:', sessionError);
      throw new Error('Session invalid - please refresh the page');
    }
    
    console.log('[fetchCRMData] Fetching with valid session for user:', userId);
    
    // Load contacts, activities, and relationship types in parallel for better performance
    const [contactsResult, activitiesResult, relationshipTypesResult] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_relationship_types')
        .select('name, relationship_intent')
        .eq('user_id', userId)
    ]);

    console.log('[fetchCRMData] Query results:', {
      contactsCount: contactsResult.data?.length || 0,
      activitiesCount: activitiesResult.data?.length || 0,
      contactsError: contactsResult.error?.message,
      activitiesError: activitiesResult.error?.message
    });

    if (contactsResult.error) throw contactsResult.error;
    if (activitiesResult.error) throw activitiesResult.error;
    if (relationshipTypesResult.error) throw relationshipTypesResult.error;

    // Create a lookup map for relationship type to intent
    const relationshipIntentMap = new Map(
      (relationshipTypesResult.data || []).map(rt => [rt.name, rt.relationship_intent])
    );

    // Transform Supabase data to match our types
    const contacts: Contact[] = (contactsResult.data || []).map(contact => {
      // Context tags will be loaded separately via useContactContexts hook
      const contextAssignments: ContactContextData[] = [];

      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        position: contact.position,
        phone: contact.phone,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        zip_code: contact.zip_code,
        country: contact.country,
        linkedinUrl: contact.linkedin_url,
        websiteUrl: contact.website_url,
        socialMediaLinks: contact.social_media_links as { instagram?: string; twitter?: string; facebook?: string; tiktok?: string; } || {},
        status: contact.status as LeadStatus,
        relationshipType: contact.relationship_type as RelationshipType,
        relationshipIntent: relationshipIntentMap.get(contact.relationship_type) as RelationshipIntent,
        relationshipStatus: contact.relationship_status || undefined, // New enhanced relationship status
        category: contact.category as ContactCategory,
        source: contact.source,
        createdAt: new Date(contact.created_at),
        lastContactDate: contact.last_contact_date ? new Date(contact.last_contact_date) : undefined,
        nextFollowUp: contact.next_follow_up ? new Date(contact.next_follow_up) : undefined,
        notes: contact.notes,
        responseReceived: contact.response_received,
        totalTouchpoints: contact.total_touchpoints,
        bookingScheduled: contact.booking_scheduled,
        archived: contact.archived,
        revenueAmount: contact.revenue_amount ? Number(contact.revenue_amount) : undefined,
        isDemo: contact.is_demo || false, // Include server-computed demo flag
        contexts: contextAssignments, // Add preloaded contexts
      };
    });

    const activities: Activity[] = (activitiesResult.data || []).map(activity => ({
      id: activity.id,
      contactId: activity.contact_id,
      type: activity.type as TouchpointType,
      title: activity.title,
      description: activity.description,
      responseReceived: activity.response_received,
      scheduledFor: activity.scheduled_for ? new Date(activity.scheduled_for) : undefined,
      completedAt: activity.completed_at ? new Date(activity.completed_at) : undefined,
      createdAt: new Date(activity.created_at),
    }));

    return { contacts, activities };
  } catch (error) {
    console.error('Error loading CRM data:', error);
    throw error;
  }
};

export const useCRMData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings: crmSettings } = useCRMSettings();
  const { triggerGamificationEvent, awardPoints } = useGamificationActions();
  const queryClient = useQueryClient();
  const [showDemoData, setShowDemoData] = useState(false);

  // Use React Query for cached data fetching with optimized caching
  const { data: crmData, isLoading, error } = useQuery({
    queryKey: ['crmData', user?.id],
    queryFn: async () => {
      return fetchCRMData(user!.id);
    },
    enabled: !!user?.id,
    staleTime: 120000, // 2 minutes - increased to reduce refetch frequency
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false, // Disabled to prevent tab-switching refetches
    refetchOnMount: true, // Allow mount refetch but respect staleTime
    refetchOnReconnect: true, // Keep for session recovery
    retry: (failureCount, error) => {
      // Only retry on network errors, not on auth errors
      return failureCount < 2 && !error.message.includes('Session');
    }
  });

  const contacts = crmData?.contacts || [];
  const activities = crmData?.activities || [];
  const hasRealData = contacts.length > 0 || activities.length > 0;

  // Use either real data or mock data
  const displayedContacts = showDemoData && !hasRealData ? mockContacts : contacts;
  const displayedActivities = showDemoData && !hasRealData ? mockActivities : activities;

  // Calculate stats
  const stats: CRMStats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const totalContacts = displayedContacts.length;
    const coldLeads = displayedContacts.filter(c => c.status === 'cold').length;
    const warmLeads = displayedContacts.filter(c => c.status === 'warm').length;
    const hotLeads = displayedContacts.filter(c => c.status === 'hot').length;
    const responseCount = displayedContacts.filter(c => c.responseReceived).length;
    const responseRate = totalContacts > 0 ? (responseCount / totalContacts) * 100 : 0;
    const bookingsScheduled = displayedContacts.filter(c => c.bookingScheduled).length;
    const totalTouchpoints = displayedContacts.reduce((sum, c) => sum + c.totalTouchpoints, 0);
    const avgTouchpointsPerLead = totalContacts > 0 ? totalTouchpoints / totalContacts : 0;
    const familiarContacts = displayedContacts.filter(c => 
      c.relationshipIntent && ['business_nurture_statuses', 'personal_statuses', 'vendor_statuses'].includes(c.relationshipIntent)
    ).length;
    const leadsCount = displayedContacts.filter(c => 
      c.relationshipIntent === 'business_lead_statuses'
    ).length;

    // Calculate today metrics
    const todayNewContacts = displayedContacts.filter(c => 
      c.createdAt && isWithinInterval(new Date(c.createdAt), { start: today, end: now })
    ).length;
    
    const todayFollowUpsCompleted = displayedActivities.filter(a => 
      a.completedAt && 
      isWithinInterval(new Date(a.completedAt), { start: today, end: now }) &&
      (a.type === 'email' || a.type === 'call' || a.type === 'meeting' || a.type === 'linkedin')
    ).length;

    // Calculate weekly metrics
    const thisWeekNewContacts = displayedContacts.filter(c => 
      isWithinInterval(c.createdAt, { start: weekStart, end: weekEnd })
    ).length;

    const thisWeekActivities = displayedActivities.filter(a => 
      a.completedAt && isWithinInterval(a.completedAt, { start: weekStart, end: weekEnd })
    ).length;

    const thisWeekFollowUpsCompleted = displayedActivities.filter(a => 
      a.completedAt && 
      isWithinInterval(a.completedAt, { start: weekStart, end: weekEnd }) &&
      (a.type === 'email' || a.type === 'call' || a.type === 'meeting' || a.type === 'linkedin')
    ).length;

    const thisWeekFollowUpsMissed = displayedContacts.filter(c => 
      c.nextFollowUp && isPast(c.nextFollowUp) && c.nextFollowUp < today
    ).length;

    // Monthly stats
    const thisMonthNewContacts = displayedContacts.filter(c => 
      isWithinInterval(c.createdAt, { start: monthStart, end: monthEnd })
    ).length;

    const thisMonthActivities = displayedActivities.filter(a => 
      a.completedAt && isWithinInterval(a.completedAt, { start: monthStart, end: monthEnd })
    ).length;

    const thisMonthFollowUpsCompleted = displayedActivities.filter(a => 
      a.completedAt && 
      isWithinInterval(a.completedAt, { start: monthStart, end: monthEnd }) &&
      (a.type === 'email' || a.type === 'call' || a.type === 'meeting' || a.type === 'linkedin')
    ).length;

    const thisMonthFollowUpsMissed = displayedContacts.filter(c => 
      c.nextFollowUp && isPast(c.nextFollowUp) && c.nextFollowUp < today
    ).length;

    return {
      totalContacts,
      coldLeads,
      warmLeads,
      hotLeads,
      responseRate,
      bookingsScheduled,
      totalTouchpoints,
      avgTouchpointsPerLead,
      familiarContacts,
      leadsCount,
      todayNewContacts,
      todayFollowUpsCompleted,
      thisWeekNewContacts,
      thisWeekFollowUpsCompleted,
      thisWeekFollowUpsMissed,
      thisWeekActivities,
      thisMonthNewContacts,
      thisMonthFollowUpsCompleted,
      thisMonthFollowUpsMissed,
      thisMonthActivities,
    };
  }, [displayedContacts, displayedActivities]);

  // Auto-hide demo data when real data exists
  useEffect(() => {
    if (hasRealData && showDemoData) {
      setShowDemoData(false);
    }
  }, [hasRealData, showDemoData]);

  // Helper to normalize values and handle serialized undefined
  const normalizeValue = (value: any): any => {
    if (!value || value === '' || (typeof value === 'object' && value._type === 'undefined')) {
      return null;
    }
    return value;
  };

  // Helper to safely convert dates
  const safeDateToISO = (date: any): string | null => {
    if (!date) return null;
    if (typeof date === 'object' && date._type === 'undefined') return null;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
    } catch {
      return null;
    }
  };

  const saveContact = async (contactData: Partial<Contact>) => {
    if (!user) return;

    try {
      // CRITICAL: Validate and refresh session before write operation
      console.log('🔐 [saveContact] Validating session before save');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ [saveContact] Session validation failed:', sessionError);
        alert('Your session has expired. Please refresh the page and try again.');
        // Force re-authentication by invalidating queries
        queryClient.invalidateQueries({ queryKey: ['access'] });
        throw new Error('Session expired - please refresh page');
      }
      
      console.log('✅ [saveContact] Session valid, proceeding with save');
      
      console.log('🔍 [saveContact] Starting contact save:', {
        user: user?.id,
        contactData: {
          name: contactData.name,
          email: contactData.email,
          hasId: !!contactData.id
        }
      });

      // Save to Supabase with normalized data
      const supabaseData = {
        name: contactData.name!,
        email: contactData.email!,
        company: normalizeValue(contactData.company),
        position: normalizeValue(contactData.position),
        phone: normalizeValue(contactData.phone),
        linkedin_url: normalizeValue(contactData.linkedinUrl),
        website_url: normalizeValue(contactData.websiteUrl),
        social_media_links: contactData.socialMediaLinks || {},
        status: contactData.status!,
        relationship_type: contactData.relationshipType!,
        relationship_status: contactData.relationshipStatus || contactData.status || 'new',
        category: contactData.category!,
        source: contactData.source || '',
        notes: normalizeValue(contactData.notes),
        response_received: contactData.responseReceived || false,
        total_touchpoints: contactData.totalTouchpoints || 0,
        booking_scheduled: contactData.bookingScheduled || false,
        archived: contactData.archived || false,
        last_contact_date: safeDateToISO(contactData.lastContactDate),
        next_follow_up: safeDateToISO(contactData.nextFollowUp),
      };

      console.log('🔍 [saveContact] Prepared supabase data:', supabaseData);

      if (contactData.id) {
        // Update existing - don't include user_id in update data
        console.log('🔍 [saveContact] Updating existing contact:', contactData.id);
        const { error } = await supabase
          .from('contacts')
          .update(supabaseData)
          .eq('id', contactData.id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('❌ [saveContact] Update error:', error);
          throw error;
        }
        console.log('✅ [saveContact] Contact updated successfully');
      } else {
        // Create new - include user_id for new contacts
        console.log('🔍 [saveContact] Creating new contact with user_id:', user.id);
        
        // Auto-compute next follow-up if not provided and settings are available
        // Skip setting follow-up for demo contacts
        // IMPORTANT: Only auto-compute for NEW contacts (no ID)
        // For existing contacts, respect the manually set follow-up date
        if (!contactData.id && !contactData.nextFollowUp && crmSettings && !isDemoContact(contactData as Contact)) {
          console.log('🆕 [saveContact] New contact - auto-computing follow-up date');
          
          const computedFollowUp = computeNextFollowUp(
            contactData as Contact, 
            crmSettings,
            new Date()
          );
          
          if (computedFollowUp) {
            supabaseData.next_follow_up = computedFollowUp.toISOString();
            console.log('📅 [saveContact] Auto-computed follow-up date:', computedFollowUp);
          } else {
            console.log('⏸️ [saveContact] No auto-computed follow-up (cadence disabled or invalid)');
          }
        } else if (contactData.id) {
          // For existing contacts, log whether we're updating the follow-up date
          console.log('✏️ [saveContact] Updating existing contact:', {
            contactId: contactData.id,
            hasManualFollowUp: !!contactData.nextFollowUp,
            followUpDate: contactData.nextFollowUp
          });
        } else if (isDemoContact(contactData as Contact)) {
          logDemoContactExclusion(contactData as Contact, 'saveContact');
          // Explicitly clear any follow-up for demo contacts
          supabaseData.next_follow_up = null;
        }

        // Refresh session for fresh JWT
        console.log('🔒 [saveContact] Refreshing session for fresh JWT...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('⚠️ [saveContact] Session refresh warning:', refreshError);
        }
        
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            ...supabaseData,
            user_id: user.id,
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('❌ [saveContact] Insert error:', error);
          throw error;
        }

        // Immediate null check - catch silent RLS failures
        if (!newContact || !newContact.id) {
          console.error('❌ [saveContact] CRITICAL: INSERT returned no data - RLS policy likely blocked SELECT!', {
            userId: user.id,
            contactName: contactData.name,
            timestamp: new Date().toISOString()
          });
          throw new Error('Failed to save contact - permission denied. Your session may have expired. Please refresh the page and try again.');
        }

        console.log('✅ [saveContact] Contact INSERT returned data:', newContact);

        // Post-save verification - confirm contact actually exists in database
        console.log('🔍 [saveContact] Verifying contact was actually saved to database...');
        await new Promise(resolve => setTimeout(resolve, 150));

        const { data: verifyData, error: verifyError } = await supabase
          .from('contacts')
          .select('id, name, email, user_id')
          .eq('id', newContact.id)
          .eq('user_id', user.id)
          .single();

        console.log('🔍 [saveContact] Verification query result:', {
          found: !!verifyData,
          contactId: newContact.id,
          userId: user.id,
          error: verifyError?.message
        });

        if (verifyError || !verifyData) {
          console.error('❌ [saveContact] CRITICAL: Contact not found in database after INSERT!', {
            contactId: newContact.id,
            userId: user.id,
            verifyError: verifyError
          });
          throw new Error('Contact was not saved to database. You may not have permission to create contacts. Please check your subscription status and try again.');
        }

        console.log('✅ [saveContact] Post-save verification PASSED - contact confirmed in database');

        // Success toast
        toast({
          title: "Contact Saved",
          description: `${contactData.name} has been successfully added to your contacts.`,
          duration: 3000,
        });

        // Award points asynchronously - completely non-blocking (for new contacts only)
        if (!isDemoContact(contactData as Contact)) {
          console.log('💰 [saveContact] Starting async points award...');
          
          (async () => {
            try {
              const { error: pointsError } = await supabase.rpc('award_points', {
                p_user_id: user.id,
                p_activity_type: 'contact_added',
                p_description: `Added contact: ${contactData.name}`,
                p_metadata: {
                  contact_id: newContact.id,
                  contact_name: contactData.name
                },
                p_skip_milestone_checks: true
              });
              
              if (pointsError) {
                console.warn('⚠️ [saveContact] Points award failed (non-blocking):', pointsError.message);
              } else {
                console.log('✅ [saveContact] Points awarded successfully');
                queryClient.invalidateQueries({ queryKey: ['pointsSummary'] });
                queryClient.invalidateQueries({ queryKey: ['pointsDetails'] });
              }
            } catch (error: any) {
              console.warn('⚠️ [saveContact] Points award error (non-blocking):', error.message);
            }
          })();
        } else {
          console.log('ℹ️ [saveContact] Skipping points award for demo contact');
        }
      }
      
      // Invalidate cache to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['crmData', user.id] });
    } catch (error: any) {
      console.error('❌ [saveContact] Error saving contact:', error);
      
      let errorMessage = 'Failed to save contact. ';
      
      if (error.message?.includes('Session expired') || error.message?.includes('permission denied')) {
        errorMessage += 'Your session has expired or you do not have permission. Please refresh the page and log in again.';
      } else if (error.message?.includes('violates row-level security policy')) {
        errorMessage += 'Permission denied - your session may have expired. Please refresh the page and log in again.';
      } else if (error.message?.includes('not saved to database')) {
        errorMessage += 'The contact could not be verified in the database. Please check your subscription status and try again.';
      } else if (error.message?.includes('subscription status')) {
        errorMessage += 'You need an active subscription, trial, or challenge participation to create contacts.';
      } else if (error.message?.includes('duplicate key') && error.message?.includes('contacts_email_user_id_key')) {
        errorMessage += 'A contact with this email already exists in your account.';
      } else if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage += 'Network error - please check your connection and refresh the page.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      toast({
        title: "Error Saving Contact",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
      
      if (error.message?.includes('Session') || error.message?.includes('permission')) {
        queryClient.invalidateQueries({ queryKey: ['access'] });
      }
      
      throw error;
    }
  };

  const saveActivity = async (activityData: Partial<Activity>) => {
    if (!user) return;
    
    try {
      console.log('[saveActivity] Starting with data:', {
        hasId: !!activityData.id,
        type: activityData.type,
        title: activityData.title,
        contactId: activityData.contactId
      });
      
      // Phase 3: Refresh session to ensure JWT is fresh
      console.log('🔒 [saveActivity] Refreshing session for fresh JWT...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('⚠️ [saveActivity] Session refresh warning:', refreshError);
      }
      
      // Phase 1: Verify auth session is valid
      console.log('🔒 [saveActivity] Checking authentication state...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('🔒 [saveActivity] No valid session:', sessionError);
        throw new Error('Your session has expired. Please log out and log back in.');
      }
      
      console.log('🔒 [saveActivity] Session valid, user ID from session:', session.user.id);
      console.log('🔒 [saveActivity] User ID from context:', user.id);
      
      if (session.user.id !== user.id) {
        console.error('🔒 [saveActivity] SESSION MISMATCH!', {
          sessionUserId: session.user.id,
          contextUserId: user.id
        });
        throw new Error('Authentication mismatch detected. Please log out and log back in.');
      }
      
      // Phase 2: Server-side access validation with fresh JWT
      console.log('🔒 [saveActivity] Validating write access via RPC...');
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('user_can_write_secure', { user_id_param: user.id });
      
      if (accessError) {
        console.error('🔒 [saveActivity] Access check failed:', accessError);
        throw new Error('Failed to verify access permissions. Please try again.');
      }
      
      if (!hasAccess) {
        console.error('🔒 [saveActivity] BLOCKED - user_can_write returned false');
        throw new Error('You need an active subscription, trial, or challenge participation to log activities.');
      }
      
      console.log('✅ [saveActivity] Access validated successfully');
      
      const isUpdate = !!activityData.id;
      console.log(`[saveActivity] ${isUpdate ? 'Updating existing' : 'Creating new'} activity`);

      let newActivity;
      if (isUpdate) {
        console.log('[saveActivity] Updating existing activity with ID:', activityData.id);
        
        // Update existing activity with explicit WHERE conditions
        const { data, error } = await supabase
          .from('activities')
          .update({
            type: activityData.type,
            title: activityData.title,
            description: activityData.description,
            message_content: activityData.messageContent || null,
            response_received: activityData.responseReceived || false,
            scheduled_for: activityData.scheduledFor?.toISOString() || null,
            completed_at: activityData.completedAt?.toISOString() || null,
          })
          .eq('id', activityData.id!)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('[saveActivity] Update error:', error);
          throw error;
        }
        newActivity = data;
        console.log('[saveActivity] Activity updated successfully:', newActivity);
      } else {
        // Create new activity
        console.log('🔥 [saveActivity] About to insert new activity into database');
        console.log('🔥 [saveActivity] Auth context at INSERT time:', {
          sessionUserId: (await supabase.auth.getSession()).data.session?.user.id,
          contextUserId: user.id,
          match: (await supabase.auth.getSession()).data.session?.user.id === user.id
        });
        
        const insertData = {
          user_id: user.id,
          contact_id: activityData.contactId!,
          type: activityData.type!,
          title: activityData.title!,
          description: activityData.description,
          message_content: activityData.messageContent || null,
          response_received: activityData.responseReceived || false,
          scheduled_for: activityData.scheduledFor?.toISOString() || null,
          completed_at: activityData.completedAt?.toISOString() || null,
        };
        
        console.log('🔥 [saveActivity] Insert data prepared:', insertData);
        
        const { data, error } = await supabase
          .from('activities')
          .insert(insertData)
          .select('*');

        console.log('🔥 [saveActivity] INSERT result:', {
          hasError: !!error,
          hasData: !!data,
          dataLength: data?.length || 0,
          error: error?.message
        });

        if (error) {
          console.error('🔥 [saveActivity] Insert error - FULL ERROR:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        // CRITICAL: Check if data was actually returned (RLS can silently block)
        if (!data || data.length === 0) {
          console.error('❌ [saveActivity] CRITICAL: INSERT returned no data - RLS policy likely blocked it!', {
            insertData,
            sessionUserId: (await supabase.auth.getSession()).data.session?.user.id
          });
          throw new Error('Failed to save activity - permission denied. Your session may have expired. Please log out and log back in.');
        }
        
        newActivity = data[0];
        console.log('🔥 [saveActivity] Activity created successfully:', newActivity);
        
        // Track last activity for version monitoring
        localStorage.setItem('last_activity_logged', new Date().toISOString());
        
        // Phase 4: Post-save verification - confirm the activity actually exists
        console.log('🔍 [saveActivity] Verifying activity was actually saved...');
        
        // Add small delay to ensure DB transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const { data: verifyData, error: verifyError, count } = await supabase
          .from('activities')
          .select('*', { count: 'exact' })
          .eq('id', newActivity.id)
          .eq('user_id', user.id);
        
        console.log('🔍 [saveActivity] Verification query result:', {
          found: !!verifyData && verifyData.length > 0,
          count,
          error: verifyError,
          activityId: newActivity.id
        });
        
        if (verifyError) {
          console.error('❌ [saveActivity] Verification query failed:', verifyError);
          throw new Error(`Failed to verify activity was saved: ${verifyError.message}`);
        }
        
        if (!verifyData || verifyData.length === 0) {
          console.error('❌ [saveActivity] CRITICAL: Activity not found in database after INSERT!', {
            activityId: newActivity.id,
            userId: user.id,
            insertData
          });
          throw new Error('Activity was not saved to database. You may not have permission to log activities. Please check your subscription status.');
        }
        
        console.log('✅ [saveActivity] Post-save verification PASSED - activity confirmed in DB:', verifyData[0]);
      }

      // Determine next follow-up date logic
      const currentContact = contacts.find(c => c.id === activityData.contactId);
      let nextFollowUpDate: Date | null = null;
      
      // Priority 1: Use user's manual follow-up date from activity if provided
      if (activityData.scheduledFor) {
        nextFollowUpDate = activityData.scheduledFor;
        console.log('[saveActivity] Using user-specified follow-up date from activity:', nextFollowUpDate);
      } 
      // Priority 2: Preserve existing contact follow-up date if it exists AND user didn't provide a new one
      else if (currentContact?.nextFollowUp && !activityData.scheduledFor) {
        // Contact already has a follow-up date and user didn't specify a new one - preserve it!
        nextFollowUpDate = currentContact.nextFollowUp;
        console.log('[saveActivity] Preserving existing contact follow-up date:', nextFollowUpDate);
      }
      // Priority 3: Only compute auto follow-up for NEW activities if no existing date and auto-followup is enabled
      else if (!isUpdate && crmSettings?.auto_followup_enabled && !isDemoContact(currentContact) && !currentContact?.nextFollowUp) {
        // Only auto-compute if contact has no follow-up date yet
        nextFollowUpDate = computeNextFollowUp(
          currentContact!,
          crmSettings,
          activityData.completedAt || new Date()
        );
        console.log('[saveActivity] Auto-computed follow-up (no existing date):', nextFollowUpDate);
      }
      // Priority 4: For updates without manual date, leave existing follow-up unchanged
      else if (isUpdate) {
        console.log('[saveActivity] Update mode: preserving existing follow-up date');
      }

      const contactUpdate: any = {
        last_contact_date: safeDateToISO(activityData.completedAt || activityData.createdAt),
        response_received: activityData.responseReceived || (currentContact?.responseReceived || false)
      };

      // Only increment touchpoint count for new activities
      if (!isUpdate) {
        contactUpdate.total_touchpoints = (currentContact?.totalTouchpoints || 0) + 1;
      }

      // Only update next_follow_up if we have a determined date or user explicitly provided one
      if (nextFollowUpDate) {
        contactUpdate.next_follow_up = nextFollowUpDate.toISOString();
        console.log('[saveActivity] Setting contact next_follow_up to:', nextFollowUpDate);
      } else if (activityData.scheduledFor === null) {
        // User explicitly cleared the follow-up date
        contactUpdate.next_follow_up = null;
        console.log('[saveActivity] User cleared follow-up date');
      }
      // For updates without scheduledFor changes, don't modify next_follow_up at all

      const { error: contactUpdateError } = await supabase
        .from('contacts')
        .update(contactUpdate)
        .eq('id', activityData.contactId!)
        .eq('user_id', user.id);
        
      if (contactUpdateError) {
        console.error('[saveActivity] Error updating contact:', contactUpdateError);
      } else {
        console.log('[saveActivity] Contact updated successfully');
      }

      // Award points for the activity (there is NO database trigger - must be done manually)
      if (!isUpdate) {
        const activityTypeForPoints = activityData.type || 'touchpoint_logged';
        const pointsAwarded = await awardPoints(
          activityTypeForPoints,
          `Activity: ${activityData.title}`,
          { 
            activity_id: newActivity.id,
            contact_id: activityData.contactId 
          }
        );
        
        if (pointsAwarded) {
          console.log('[saveActivity] Points awarded successfully for activity');
        } else {
          console.warn('[saveActivity] Failed to award points for activity');
        }
      }
      
      // Force immediate refetch to ensure UI updates instantly with new touchpoint data
      console.log('🔄 [saveActivity] Starting data refetch...');
      const refetchResult = await queryClient.refetchQueries({ 
        queryKey: ['crmData', user.id],
        type: 'active'
      });
      console.log('🔄 [saveActivity] Refetch result:', refetchResult);
      
      // Add delay to ensure React completes rendering before refetch
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Double-check that the activity appears in the refetched data
      const cachedData = queryClient.getQueryData(['crmData', user.id]) as any;
      console.log('🔍 [saveActivity] Cache data after refetch:', {
        hasData: !!cachedData,
        activitiesCount: cachedData?.activities?.length,
        contactsCount: cachedData?.contacts?.length
      });
      
      if (cachedData && !isUpdate) {
        const activityExists = cachedData.activities?.some((a: any) => a.id === newActivity?.id);
        console.log('🔍 [saveActivity] Activity in cache after refetch?', activityExists, 'ID:', newActivity?.id);
        
        if (!activityExists) {
          console.error('⚠️ [saveActivity] CRITICAL: Activity not found in cache after refetch!');
          // Show user-friendly toast instead of throwing error
          toast({
            title: "Touchpoint Saved",
            description: "Your touchpoint was saved successfully. Please refresh the page to see it in your list.",
            duration: 10000,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['points', user.id] });
      queryClient.invalidateQueries({ queryKey: ['badges', user.id] });
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!user) return;

    try {
      console.log('[deleteActivity] Deleting activity:', activityId);
      
      // Get the activity first to find the contact to update
      const activityToDelete = activities.find(a => a.id === activityId);
      if (!activityToDelete) {
        throw new Error('Activity not found');
      }

      // Delete from Supabase (CASCADE will automatically clean up user_metrics)
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('[deleteActivity] Activity deleted successfully');

      // Update contact rollups after deletion
      const contact = contacts.find(c => c.id === activityToDelete.contactId);
      if (contact) {
        // Recalculate touchpoint count and last contact date from remaining activities
        const remainingActivities = activities.filter(a => 
          a.id !== activityId && a.contactId === contact.id
        );
        
        const newTouchpointCount = Math.max(0, remainingActivities.length);
        
        // Find the most recent activity date from remaining activities
        let lastContactDate: string | null = null;
        if (remainingActivities.length > 0) {
          const sortedActivities = remainingActivities.sort((a, b) => 
            new Date(b.completedAt || b.createdAt).getTime() - 
            new Date(a.completedAt || a.createdAt).getTime()
          );
          const latestActivityDate = sortedActivities[0].completedAt || sortedActivities[0].createdAt;
          lastContactDate = latestActivityDate instanceof Date ? latestActivityDate.toISOString() : latestActivityDate;
        }
        
        // Recalculate next follow-up based on new last contact date
        let nextFollowUpDate: string | null = null;
        if (lastContactDate && crmSettings && !isDemoContact(contact)) {
          const computedFollowUp = computeNextFollowUp(
            contact,
            crmSettings,
            new Date(lastContactDate)
          );
          nextFollowUpDate = computedFollowUp ? computedFollowUp.toISOString() : null;
        }

        // Note: Revenue recalculation is handled automatically by 
        // the recalculate_contact_revenue() database trigger
        
        // Update contact with recalculated values (excluding revenue_amount - trigger handles it)
        const contactUpdate: any = {
          total_touchpoints: newTouchpointCount,
          last_contact_date: lastContactDate,
          next_follow_up: nextFollowUpDate
        };

        const { error: contactUpdateError } = await supabase
          .from('contacts')
          .update(contactUpdate)
          .eq('id', contact.id)
          .eq('user_id', user.id);
          
        if (contactUpdateError) {
          console.error('[deleteActivity] Error updating contact:', contactUpdateError);
        } else {
          console.log('[deleteActivity] Contact updated successfully');
        }
      }
      
      // Invalidate cache to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['crmData', user.id] });
    } catch (error) {
      console.error('[deleteActivity] Error deleting activity:', error);
      throw error;
    }
  };

  return {
    contacts: displayedContacts,
    activities: displayedActivities,
    stats,
    loading: isLoading,
    hasRealData,
    showDemoData,
    setShowDemoData,
    saveContact,
    saveActivity,
    deleteActivity,
  };
};
