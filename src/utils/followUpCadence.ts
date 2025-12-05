import { addDays, addWeeks, addMonths } from 'date-fns';
import { Contact } from '@/types/crm';
import { CRMSettings, CadenceRule } from '@/types/crmSettings';

export function computeNextFollowUp(
  contact: Contact,
  settings: CRMSettings,
  fromDate: Date = new Date()
): Date | null {
  if (!settings.auto_followup_enabled) {
    console.log('⏸️ [computeNextFollowUp] Auto-followup disabled in settings');
    return null;
  }

  let cadenceRule: CadenceRule | null = null;

  // Look up cadence based on relationship intent and status
  if (contact.relationshipIntent && contact.relationshipStatus) {
    const intentGroup = settings.cadences[contact.relationshipIntent as keyof typeof settings.cadences];
    
    console.log('🔍 [computeNextFollowUp] Looking up cadence:', {
      contactName: contact.name,
      intent: contact.relationshipIntent,
      status: contact.relationshipStatus,
      intentGroupExists: !!intentGroup,
      intentGroupType: typeof intentGroup
    });
    
    // intentGroup should be an object with status rules (not the fallback rule)
    if (intentGroup && typeof intentGroup === 'object' && 'enabled' in intentGroup === false) {
      const statusRule = (intentGroup as any)[contact.relationshipStatus];
      
      console.log('🔍 [computeNextFollowUp] Status rule lookup:', {
        statusRule: statusRule ? { enabled: statusRule.enabled, value: statusRule.value, unit: statusRule.unit } : null,
        availableStatuses: Object.keys(intentGroup)
      });
      
      if (statusRule?.enabled) {
        cadenceRule = statusRule;
        console.log('✅ [computeNextFollowUp] Found valid cadence rule:', cadenceRule);
      } else if (statusRule) {
        console.warn('⚠️ [computeNextFollowUp] Status rule exists but is disabled');
      } else {
        console.warn('⚠️ [computeNextFollowUp] No status rule found - invalid status for this intent!', {
          intent: contact.relationshipIntent,
          status: contact.relationshipStatus,
          validStatuses: Object.keys(intentGroup)
        });
      }
    }
  } else {
    console.warn('⚠️ [computeNextFollowUp] Missing intent or status:', {
      hasIntent: !!contact.relationshipIntent,
      hasStatus: !!contact.relationshipStatus
    });
  }

  // If no enabled rule found, use fallback
  if (!cadenceRule) {
    cadenceRule = settings.cadences.fallback;
    console.log('📌 [computeNextFollowUp] Using fallback cadence:', cadenceRule);
  }

  // If fallback is also disabled, return null
  if (!cadenceRule?.enabled || cadenceRule.value === undefined || cadenceRule.value === null || !cadenceRule.unit) {
    console.log('⏸️ [computeNextFollowUp] No valid cadence rule (fallback also disabled or invalid)');
    return null;
  }

  // Calculate the next follow-up date
  let nextDate: Date | null = null;
  switch (cadenceRule.unit) {
    case 'days':
      nextDate = cadenceRule.value === 0 ? fromDate : addDays(fromDate, cadenceRule.value);
      break;
    case 'weeks':
      nextDate = addWeeks(fromDate, cadenceRule.value);
      break;
    case 'months':
      nextDate = addMonths(fromDate, cadenceRule.value);
      break;
    default:
      console.warn('⚠️ [computeNextFollowUp] Invalid cadence unit:', cadenceRule.unit);
      return null;
  }

  console.log('📅 [computeNextFollowUp] Computed follow-up date:', {
    contactName: contact.name,
    fromDate: fromDate.toISOString(),
    nextDate: nextDate?.toISOString(),
    rule: { value: cadenceRule.value, unit: cadenceRule.unit }
  });

  return nextDate;
}

export function formatCadenceRule(rule: CadenceRule): string {
  if (!rule.enabled) return 'Disabled';
  if (rule.value === undefined || rule.value === null || !rule.unit) return 'No cadence';
  
  // Special case for 0 days = today
  if (rule.value === 0 && rule.unit === 'days') return 'Today';
  
  const unitLabel = rule.value === 1 ? rule.unit.slice(0, -1) : rule.unit;
  return `Every ${rule.value} ${unitLabel}`;
}