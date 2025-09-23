import React, { useState, useEffect, useMemo } from 'react';
import { Contact, Activity, CRMStats, TouchpointType, LeadStatus, RelationshipType, ContactCategory } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { computeNextFollowUp } from '@/utils/followUpCadence';
import { isDemoContact, logDemoContactExclusion } from '@/utils/demoContactUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCRMSettings } from './useCRMSettings';
import { useGamificationActions } from './useGamificationActions';

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
    relationshipType: "lead",
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
    relationshipType: "past_client",
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
    relationshipType: "lead",
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
    // Load contacts and activities in parallel for better performance
    const [contactsResult, activitiesResult] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    if (contactsResult.error) throw contactsResult.error;
    if (activitiesResult.error) throw activitiesResult.error;

    // Transform Supabase data to match our types
    const contacts: Contact[] = (contactsResult.data || []).map(contact => ({
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
    }));

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

  // Use React Query for cached data fetching - refetch on mount for critical dashboard data
  const { data: crmData, isLoading, error } = useQuery({
    queryKey: ['crmData', user?.id],
    queryFn: () => fetchCRMData(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - match global settings
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Critical dashboard data should refresh on mount
    refetchOnReconnect: false,
    retry: 0 // Don't retry failed requests
  });

  const contacts = crmData?.contacts || [];
  const activities = crmData?.activities || [];
  const hasRealData = contacts.length > 0 || activities.length > 0;

  // Use either real data or mock data
  const displayedContacts = showDemoData && !hasRealData ? mockContacts : contacts;
  const displayedActivities = showDemoData && !hasRealData ? mockActivities : activities;

  // Calculate stats
  const stats: CRMStats = useMemo(() => {
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
      ['past_client', 'friend_family', 'associate_partner', 'referral_source'].includes(c.relationshipType)
    ).length;
    const leadsCount = displayedContacts.filter(c => 
      c.relationshipType === 'lead' || c.relationshipType === 'lead_amplifier'
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
    };
  }, [displayedContacts]);

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
        if (!contactData.nextFollowUp && crmSettings && !isDemoContact(contactData as Contact)) {
          const computedFollowUp = computeNextFollowUp(
            contactData as Contact, 
            crmSettings,
            new Date()
          );
          if (computedFollowUp) {
            supabaseData.next_follow_up = computedFollowUp.toISOString();
            console.log('🔍 [saveContact] Auto-computed follow-up date:', computedFollowUp);
          }
        } else if (isDemoContact(contactData as Contact)) {
          logDemoContactExclusion(contactData as Contact, 'saveContact');
          // Explicitly clear any follow-up for demo contacts
          supabaseData.next_follow_up = null;
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

        console.log('✅ [saveContact] Contact created successfully:', newContact);

        // Award +10 points for new contact (not demo contacts) - non-blocking
        if (newContact && !isDemoContact(contactData as Contact)) {
          console.log('💰 [saveContact] Awarding +10 points for new contact');
          
          // Make points award truly non-blocking and non-affecting of the main flow
          setTimeout(async () => {
            try {
              await awardPoints('contact_added', `Added contact: ${contactData.name}`, {
                contact_id: newContact.id,
                contact_name: contactData.name
              });
              console.log('✅ [saveContact] Points awarded successfully');
            } catch (error: any) {
              console.warn('⚠️ [saveContact] Points award failed (non-blocking):', error.message);
              // Don't show error to user - this is background gamification
            }
          }, 100); // Small delay to ensure it doesn't block the main flow
        } else if (isDemoContact(contactData as Contact)) {
          console.log('ℹ️ [saveContact] Skipping points award for demo contact');
        }

        // Points are now automatically awarded by database triggers - no need for manual gamification calls
        console.log('[saveContact] Contact saved - points will be automatically awarded by database triggers');
      }
      
      // Invalidate cache to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['crmData', user.id] });
    } catch (error) {
      console.error('❌ [saveContact] Error saving contact:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to save contact. ';
      
      if (error.message?.includes('violates row-level security policy')) {
        errorMessage += 'Permission denied - please make sure you are logged in.';
      } else if (error.message?.includes('duplicate key') && error.message?.includes('contacts_email_user_id_key')) {
        errorMessage += 'A contact with this email already exists.';
      } else if (error.message?.includes('unique_milestone_bonus')) {
        errorMessage += 'Processing milestone bonus - please wait and try again.';
      } else if (error.message?.includes('duplicate key')) {
        errorMessage += 'System processing conflict - please try again in a moment.';
      } else if (error.message?.includes('null value')) {
        errorMessage += 'Please fill in all required fields (Name and Email).';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      alert(errorMessage);
      throw error; // Re-throw so calling code can handle it
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
        
        const insertData = {
          user_id: user.id,
          contact_id: activityData.contactId!,
          type: activityData.type!,
          title: activityData.title!,
          description: activityData.description,
          response_received: activityData.responseReceived || false,
          scheduled_for: activityData.scheduledFor?.toISOString() || null,
          completed_at: activityData.completedAt?.toISOString() || null,
        };
        
        console.log('🔥 [saveActivity] Insert data prepared:', insertData);
        
        const { data, error } = await supabase
          .from('activities')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('🔥 [saveActivity] Insert error - FULL ERROR:', error);
          throw error;
        }
        
        newActivity = data;
        console.log('🔥 [saveActivity] Activity created successfully:', newActivity);
      }

      // Determine next follow-up date logic
      const currentContact = contacts.find(c => c.id === activityData.contactId);
      let nextFollowUpDate: Date | null = null;
      
      // Priority 1: Use user's manual follow-up date if provided
      if (activityData.scheduledFor) {
        nextFollowUpDate = activityData.scheduledFor;
        console.log('[saveActivity] Using user-specified follow-up date:', nextFollowUpDate);
      } 
      // Priority 2: Only compute auto follow-up for NEW activities if auto-followup is enabled and no manual date
      else if (!isUpdate && crmSettings?.auto_followup_enabled && !isDemoContact(currentContact)) {
        nextFollowUpDate = computeNextFollowUp(
          currentContact!,
          crmSettings,
          activityData.completedAt || new Date()
        );
        console.log('[saveActivity] Auto-computed follow-up date:', nextFollowUpDate);
      }
      // Priority 3: For updates without manual date, leave existing follow-up unchanged
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

      // Points are now automatically awarded by database triggers - no need for manual gamification calls
      console.log('[saveActivity] Activity saved - points will be automatically awarded by database triggers');
      
      // Invalidate relevant caches to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['crmData', user.id] });
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

      // Handle revenue-specific cleanup before deleting the activity
      if (activityToDelete.type === 'revenue') {
        console.log('[deleteActivity] Revenue activity detected, performing cleanup');
        
        // Parse the revenue amount from the activity title (format: "Revenue: $X.XX")
        const amountMatch = activityToDelete.title.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        
        if (amount > 0) {
          // TODO: Delete user_metrics entry - currently disabled due to TypeScript issues
          // This will be resolved in a future update
          console.log('[deleteActivity] Skipping metrics cleanup due to TypeScript limitations - amount was:', amount);
        }
      }

      // Delete from Supabase
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

        // For revenue activities, also recalculate total revenue
        let updatedRevenue = contact.revenueAmount || 0;
        if (activityToDelete.type === 'revenue') {
          // Recalculate contact's total revenue from remaining user_metrics
          const { data: remainingRevenue } = await supabase
            .from('user_metrics')
            .select('value')
            .eq('user_id', user.id)
            .eq('metric_name', 'event_value')
            .eq('metric_type', 'currency')
            .eq('contact_id', contact.id);
          
          updatedRevenue = (remainingRevenue || []).reduce((sum, entry) => sum + (entry.value || 0), 0);
          console.log('[deleteActivity] Recalculated revenue for contact:', updatedRevenue);
        }

        // Update contact with recalculated values
        const contactUpdate: any = {
          total_touchpoints: newTouchpointCount,
          last_contact_date: lastContactDate,
          next_follow_up: nextFollowUpDate
        };
        
        // Only update revenue if this was a revenue activity
        if (activityToDelete.type === 'revenue') {
          contactUpdate.revenue_amount = updatedRevenue;
        }

        const { error: contactUpdateError } = await supabase
          .from('contacts')
          .update(contactUpdate)
          .eq('id', contact.id)
          .eq('user_id', user.id);
          
        if (contactUpdateError) {
          console.error('[deleteActivity] Error updating contact:', contactUpdateError);
        } else {
          console.log('[deleteActivity] Contact updated successfully with new counts and revenue');
          
          // Update local state immediately to reflect changes in UI
          if (activityToDelete.type === 'revenue') {
            queryClient.setQueryData(['crmData', user.id], (oldData: any) => {
              if (oldData?.contacts) {
                return {
                  ...oldData,
                  contacts: oldData.contacts.map((c: any) => 
                    c.id === contact.id 
                      ? { ...c, revenueAmount: updatedRevenue }
                      : c
                  ),
                  activities: oldData.activities?.filter((a: any) => a.id !== activityId) || []
                };
              }
              return oldData;
            });
          }
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
    // Legacy compatibility - now handled by React Query cache invalidation
    setContacts: () => console.log('Legacy setContacts call - now using React Query'),
    setActivities: () => console.log('Legacy setActivities call - now using React Query'),
  };
};
