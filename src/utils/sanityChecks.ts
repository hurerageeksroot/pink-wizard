/**
 * Sanity checks and smoke tests for critical app functionality
 */

import { supabase } from '@/integrations/supabase/client';

export interface SanityCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * Basic connectivity and auth check
 */
export async function checkAuthConnection(): Promise<SanityCheckResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return {
        name: 'Auth Connection',
        status: 'fail',
        message: `Auth error: ${error.message}`,
        details: error
      };
    }

    return {
      name: 'Auth Connection',
      status: user ? 'pass' : 'warning',
      message: user ? 'User authenticated' : 'No user session',
      details: { userId: user?.id }
    };
  } catch (error) {
    return {
      name: 'Auth Connection',
      status: 'fail',
      message: `Connection failed: ${error}`,
      details: error
    };
  }
}

/**
 * Check if critical tables are accessible
 */
export async function checkDatabaseAccess(): Promise<SanityCheckResult> {
  try {
    const { error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    const { error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1);

    const { error: pointsError } = await supabase
      .from('user_points_ledger')
      .select('id')
      .limit(1);

    const errors = [contactsError, activitiesError, pointsError].filter(Boolean);

    if (errors.length > 0) {
      return {
        name: 'Database Access',
        status: 'fail',
        message: `Database access failed: ${errors.map(e => e?.message).join(', ')}`,
        details: errors
      };
    }

    return {
      name: 'Database Access',
      status: 'pass',
      message: 'All critical tables accessible'
    };
  } catch (error) {
    return {
      name: 'Database Access',
      status: 'fail',
      message: `Database check failed: ${error}`,
      details: error
    };
  }
}

/**
 * Check if demo contact detection is working
 */
export async function checkDemoContactDetection(): Promise<SanityCheckResult> {
  try {
    // Check if we have any demo contacts marked properly
    const { data: demoCounts, error } = await supabase
      .from('contacts')
      .select('is_demo')
      .limit(100);

    if (error) {
      return {
        name: 'Demo Contact Detection',
        status: 'fail',
        message: `Query failed: ${error.message}`,
        details: error
      };
    }

    const demoCount = demoCounts?.filter(c => c.is_demo).length || 0;
    const totalCount = demoCounts?.length || 0;

    return {
      name: 'Demo Contact Detection',
      status: 'pass',
      message: `Demo contact detection active`,
      details: { demoCount, totalCount }
    };
  } catch (error) {
    return {
      name: 'Demo Contact Detection',
      status: 'fail',
      message: `Demo detection check failed: ${error}`,
      details: error
    };
  }
}

/**
 * Run all sanity checks
 */
export async function runSanityChecks(): Promise<SanityCheckResult[]> {
  const checks = await Promise.allSettled([
    checkAuthConnection(),
    checkDatabaseAccess(),
    checkDemoContactDetection()
  ]);

  return checks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        name: `Check ${index + 1}`,
        status: 'fail' as const,
        message: `Check failed: ${result.reason}`,
        details: result.reason
      };
    }
  });
}

/**
 * Log sanity check results to console
 */
export function logSanityResults(results: SanityCheckResult[]) {
  console.group('🔍 Sanity Check Results');
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.details && (result.status === 'fail' || result.status === 'warning')) {
      console.log('   Details:', result.details);
    }
  });
  
  console.groupEnd();
  
  const failures = results.filter(r => r.status === 'fail');
  if (failures.length > 0) {
    console.warn(`⚠️ ${failures.length} sanity check(s) failed. App may not function correctly.`);
  } else {
    console.log('✅ All sanity checks passed. App is healthy.');
  }
}