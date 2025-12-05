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
 * 
 * IMPORTANT: We do NOT check the 'notes' field for demo indicators.
 * 
 * Reason: Notes are user-generated content where business terms like "demo", 
 * "test", "sample", "example" naturally appear in legitimate contexts:
 * - "Met with client to demo our product"
 * - "They want to test the platform"
 * - "This is an example of their previous work"
 * 
 * Checking notes causes too many false positives. Instead, we rely on
 * email, source, company, and name fields which are more reliable indicators
 * of actual demo/test contacts.
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

  // Check for demo indicators in company (slightly relaxed - removed 'demo' since "Demo Day" is legitimate)
  const companyDemoIndicators = [
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

  return hasEmailDemo || hasSourceDemo || hasCompanyDemo || hasNameDemo;
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