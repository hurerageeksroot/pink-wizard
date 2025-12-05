// Enhanced Relationship System Types
export type RelationshipIntent = 
  | 'business_lead_statuses'
  | 'business_nurture_statuses'
  | 'personal_statuses'
  | 'civic_statuses'
  | 'vendor_statuses'
  | 'other_misc';

export type RelationshipType = string;

// Dynamic relationship status based on relationship intent
export type RelationshipStatus = string;

// ContactCategory is now dynamic - stored as string and managed via useContactCategories hook  
export type ContactCategory = string;

// Contact Context for multi-tag system
export type ContactContext = string;

// Legacy support - will be migrated to RelationshipStatus
export type LeadStatus = 'none' | 'cold' | 'warm' | 'hot' | 'won' | 'lost_maybe_later' | 'lost_not_fit';

export type TouchpointType = 'email' | 'linkedin' | 'social' | 'call' | 'meeting' | 'mail' | 'text' | 'introduction';

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
  status: LeadStatus; // Legacy field - will be migrated
  relationshipStatus?: RelationshipStatus; // New dynamic status field
  relationshipType: RelationshipType;
  relationshipIntent?: RelationshipIntent; // Intent category for cadence lookup
  category: ContactCategory; // Legacy single category - will be migrated
  contexts?: ContactContextData[]; // New multi-tag system - preloaded context data
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
  messageContent?: string; // Actual content sent/discussed (email body, text, call notes, etc.)
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
  
  // Daily metrics
  todayNewContacts: number;
  todayFollowUpsCompleted: number;
  
  // Weekly metrics
  thisWeekNewContacts: number;
  thisWeekFollowUpsCompleted: number;
  thisWeekFollowUpsMissed: number;
  thisWeekActivities: number;
  
  // Monthly metrics
  thisMonthNewContacts: number;
  thisMonthFollowUpsCompleted: number;
  thisMonthFollowUpsMissed: number;
  thisMonthActivities: number;
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
  contactSpecificGoal?: string;
  coreDesire?: 'breakthrough' | 'relationships' | 'informed_decisions' | 'achieve_goals' | 'not_sure';
  coreFear?: 'plateauing' | 'missing_connections' | 'wrong_choice' | 'wasting_time' | 'not_sure';
}

// Enhanced Relationship System Interfaces
export interface ContactContextData {
  id: string;
  name: string;
  label: string;
  iconName: string;
  colorClass: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactContextCreate {
  name: string;
  label: string;
  iconName?: string;
  colorClass?: string;
}

export interface EnhancedRelationshipTypeData {
  id: string;
  name: string;
  label: string;
  iconName: string;
  colorClass: string;
  relationshipIntent: RelationshipIntent;
  isDefault: boolean;
  sortOrder: number;
}

export interface EnhancedRelationshipTypeCreate {
  name: string;
  label: string;
  iconName?: string;
  colorClass?: string;
  relationshipIntent: RelationshipIntent;
}

// Status configurations for different relationship intents
export interface RelationshipStatusConfig {
  [key: string]: {
    label: string;
    description: string;
    colorClass: string;
    isTerminal?: boolean; // true for statuses like 'won' or 'lost'
  };
}

export interface RelationshipIntentConfig {
  label: string;
  description: string;
  iconName: string;
  colorClass: string;
  statusOptions: RelationshipStatusConfig;
  defaultStatus: string;
}