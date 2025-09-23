export type CadenceUnit = 'days' | 'weeks' | 'months';

export interface CadenceRule {
  enabled: boolean;
  value?: number;
  unit?: CadenceUnit;
}

export interface CRMCadences {
  status: {
    cold: CadenceRule;
    warm: CadenceRule;
    hot: CadenceRule;
    won: CadenceRule;
    lost_maybe_later: CadenceRule;
    lost_not_fit: CadenceRule;
    none: CadenceRule;
  };
  relationship: {
    lead: CadenceRule;
    lead_amplifier: CadenceRule;
    past_client: CadenceRule;
    friend_family: CadenceRule;
    associate_partner: CadenceRule;
    referral_source: CadenceRule;
    booked_client: CadenceRule;
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