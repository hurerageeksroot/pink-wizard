export type LeadStatus = 'none' | 'cold' | 'warm' | 'hot' | 'won' | 'lost_maybe_later' | 'lost_not_fit';

export type RelationshipType = 'lead' | 'lead_amplifier' | 'past_client' | 'friend_family' | 'associate_partner' | 'referral_source' | 'booked_client';

// ContactCategory is now dynamic - stored as string and managed via useContactCategories hook
export type ContactCategory = string;

export type TouchpointType = 'email' | 'linkedin' | 'social' | 'call' | 'meeting' | 'mail' | 'text';

export type ActivityType = TouchpointType | 'revenue' | 'status_change';

export interface Contact {
  id: string;
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
  socialMediaLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
  status: LeadStatus;
  relationshipType: RelationshipType;
  category: ContactCategory;
  source: string;
  createdAt: Date;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  notes?: string;
  responseReceived: boolean;
  totalTouchpoints: number;
  bookingScheduled: boolean;
  archived: boolean;
  revenueAmount?: number;
  isDemo?: boolean; // Server-computed demo flag
}

export interface Activity {
  id: string;
  contactId: string;
  type: ActivityType;
  title: string;
  description?: string;
  responseReceived: boolean;
  scheduledFor?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CRMStats {
  totalContacts: number;
  coldLeads: number;
  warmLeads: number;
  hotLeads: number;
  responseRate: number;
  bookingsScheduled: number;
  totalTouchpoints: number;
  avgTouchpointsPerLead: number;
  familiarContacts: number;
  leadsCount: number;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  valueProp?: string;
  industry?: string;
  targetMarket?: string;
  keyDifferentiators?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutreachRequest {
  outreachType: 'cold' | 'warm' | 'follow_up';
  segment: ContactCategory;
  goals: string;
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
  psychologicalLevers: string[];
  channel: 'email' | 'linkedin' | 'social';
  sequenceStep: number;
  length: 'short' | 'medium' | 'long';
  holidayEdition: boolean;
  proofAssets: string[];
  personalizationTokens: string;
  contactName?: string;
  offerIncentive?: string;
  callToAction?: string;
}