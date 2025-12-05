export type CadenceUnit = 'days' | 'weeks' | 'months';

export interface CadenceRule {
  enabled: boolean;
  value?: number;
  unit?: CadenceUnit;
}

// Intent-based cadence structure
export interface CRMCadences {
  business_lead_statuses: {
    cold: CadenceRule;
    warm: CadenceRule;
    hot: CadenceRule;
    won: CadenceRule;
    lost_not_fit: CadenceRule;
    lost_maybe_later: CadenceRule;
  };
  business_nurture_statuses: {
    current_client: CadenceRule;
    past_client: CadenceRule;
    current_amplifier: CadenceRule;
    strategic_partner: CadenceRule;
  };
  personal_statuses: {
    friendly_not_close: CadenceRule;
    outer_circle: CadenceRule;
    close_circle: CadenceRule;
    inner_circle: CadenceRule;
    past_connection: CadenceRule;
  };
  civic_statuses: {
    new: CadenceRule;
    connected: CadenceRule;
    trusted: CadenceRule;
    unaligned: CadenceRule;
  };
  vendor_statuses: {
    potential: CadenceRule;
    active: CadenceRule;
    preferred: CadenceRule;
  };
  fallback: CadenceRule;
}

export interface CRMSettings {
  id: string;
  user_id: string;
  auto_followup_enabled: boolean;
  cadences: CRMCadences;
  created_at: string;
  updated_at: string;
}