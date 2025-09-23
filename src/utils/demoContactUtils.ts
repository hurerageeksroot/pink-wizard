/**
 * Utility functions for detecting and handling demo contacts
 */

interface ContactLike {
  email: string;
  source?: string;
  notes?: string;
  company?: string;
  name?: string;
  isDemo?: boolean; // Server-computed demo flag
}

/**
 * Determines if a contact is a demo/test contact that should be excluded from follow-up emails
 * Prioritizes server-side is_demo flag, falls back to client-side detection
 */
export const isDemoContact = (contact: ContactLike): boolean => {
  if (!contact) return false;

  // First, check if server has already computed the demo flag
  if (typeof contact.isDemo === 'boolean') {
    return contact.isDemo;
  }

  // Fallback to client-side detection for backwards compatibility
  const email = contact.email?.toLowerCase() || '';
  const source = contact.source?.toLowerCase() || '';
  const notes = contact.notes?.toLowerCase() || '';
  const company = contact.company?.toLowerCase() || '';
  const name = contact.name?.toLowerCase() || '';

  // Check for demo indicators in email
  const emailDemoIndicators = [
    'demo',
    'test',
    'example.com',
    '@mailinator',
    '@10minutemail',
    '@guerrillamail',
    'noreply',
    'no-reply',
    'donotreply',
    '@sample',
    '@fake',
    '@dummy'
  ];

  const hasEmailDemo = emailDemoIndicators.some(indicator => email.includes(indicator));

  // Check for demo indicators in source
  const sourceDemoIndicators = [
    'demo',
    'test',
    'seed',
    'sample',
    'example',
    'fake'
  ];

  const hasSourceDemo = sourceDemoIndicators.some(indicator => source.includes(indicator));

  // Check for demo indicators in notes
  const notesDemoIndicators = [
    'demo',
    'test',
    'sample',
    'example',
    'fake',
    'generated'
  ];

  const hasNotesDemo = notesDemoIndicators.some(indicator => notes.includes(indicator));

  // Check for demo indicators in company
  const companyDemoIndicators = [
    'demo',
    'test',
    'sample',
    'example',
    'fake corp',
    'acme corp'
  ];

  const hasCompanyDemo = companyDemoIndicators.some(indicator => company.includes(indicator));

  // Check for demo indicators in name
  const nameDemoIndicators = [
    'demo',
    'test user',
    'sample',
    'example'
  ];

  const hasNameDemo = nameDemoIndicators.some(indicator => name.includes(indicator));

  return hasEmailDemo || hasSourceDemo || hasNotesDemo || hasCompanyDemo || hasNameDemo;
};

/**
 * Logs when a demo contact is detected and excluded from follow-up processing
 */
export const logDemoContactExclusion = (contact: ContactLike, context: string): void => {
  console.log(`[${context}] Excluding demo contact from follow-up processing:`, {
    name: contact.name,
    email: contact.email,
    source: contact.source,
    company: contact.company
  });
};