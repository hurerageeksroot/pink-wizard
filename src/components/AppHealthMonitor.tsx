import { useEffect } from 'react';
import { runSanityChecks, logSanityResults } from '@/utils/sanityChecks';

/**
 * Development-only component that runs sanity checks periodically
 */
export function AppHealthMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Run initial sanity check
    const runInitialCheck = async () => {
      console.log('🚀 Running initial app health check...');
      const results = await runSanityChecks();
      logSanityResults(results);
    };

    // Run check after a short delay to let the app initialize
    const timer = setTimeout(runInitialCheck, 2000);

    return () => clearTimeout(timer);
  }, []);

  // This component renders nothing
  return null;
}