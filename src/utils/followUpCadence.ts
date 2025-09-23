import { addDays, addWeeks, addMonths } from 'date-fns';
import { Contact } from '@/types/crm';
import { CRMSettings, CadenceRule } from '@/types/crmSettings';

export function computeNextFollowUp(
  contact: Contact,
  settings: CRMSettings,
  fromDate: Date = new Date()
): Date | null {
  if (!settings.auto_followup_enabled) {
    return null;
  }

  let cadenceRule: CadenceRule | null = null;

  // Priority order: Relationship rules first, then status rules, then fallback
  // 1. Check relationship-based cadences first (this is the primary logic)
  if (contact.relationshipType && settings.cadences.relationship[contact.relationshipType]) {
    const relationshipRule = settings.cadences.relationship[contact.relationshipType];
    if (relationshipRule.enabled) {
      cadenceRule = relationshipRule;
    }
  }

  // 2. If no enabled relationship rule, check status-based cadences
  if (!cadenceRule && contact.status && settings.cadences.status[contact.status]) {
    const statusRule = settings.cadences.status[contact.status];
    if (statusRule.enabled) {
      cadenceRule = statusRule;
    }
  }

  // 3. If still no rule, use fallback
  if (!cadenceRule) {
    cadenceRule = settings.cadences.fallback;
  }

  // If fallback is also disabled, return null
  // Note: Allow value of 0 for "Today" cadences
  if (!cadenceRule?.enabled || cadenceRule.value === undefined || cadenceRule.value === null || !cadenceRule.unit) {
    return null;
  }

  // Calculate the next follow-up date
  switch (cadenceRule.unit) {
    case 'days':
      // If value is 0, return today (same date)
      return cadenceRule.value === 0 ? fromDate : addDays(fromDate, cadenceRule.value);
    case 'weeks':
      return addWeeks(fromDate, cadenceRule.value);
    case 'months':
      return addMonths(fromDate, cadenceRule.value);
    default:
      return null;
  }
}

export function formatCadenceRule(rule: CadenceRule): string {
  if (!rule.enabled) return 'Disabled';
  if (rule.value === undefined || rule.value === null || !rule.unit) return 'No cadence';
  
  // Special case for 0 days = today
  if (rule.value === 0 && rule.unit === 'days') return 'Today';
  
  const unitLabel = rule.value === 1 ? rule.unit.slice(0, -1) : rule.unit;
  return `Every ${rule.value} ${unitLabel}`;
}