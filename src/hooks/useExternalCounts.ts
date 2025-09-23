import { useState, useEffect } from 'react';
import type { ExternalOutreachCounts } from '@/components/ExternalCountsBridge';

export const useExternalCounts = () => {
  const [counts, setCounts] = useState<ExternalOutreachCounts | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isEmbeddedMode, setIsEmbeddedMode] = useState(false);

  useEffect(() => {
    // More robust iframe detection
    const inIframe = (() => {
      try {
        // Check if window.parent is accessible and different from window
        const parentExists = window.parent && window.parent !== window;
        
        // Check if we can access parent location (same origin)
        let canAccessParent = false;
        try {
          canAccessParent = !!window.parent.location.href;
        } catch (e) {
          // Cross-origin, but still in iframe
          canAccessParent = true;
        }
        
        // Check document referrer for additional confirmation
        const hasReferrer = document.referrer && document.referrer !== window.location.href;
        
        // Check window.top
        const hasTop = window.top !== window;
        
        const result = parentExists && (canAccessParent || hasReferrer || hasTop);
        
        console.log('[useExternalCounts] Iframe detection details:', {
          parentExists,
          canAccessParent,
          hasReferrer,
          hasTop,
          result,
          referrer: document.referrer,
          location: window.location.href,
          userAgent: navigator.userAgent
        });
        
        return result;
      } catch (error) {
        console.log('[useExternalCounts] Iframe detection error:', error);
        return false; // If any errors, assume not in iframe
      }
    })();
    
    console.log('[useExternalCounts] Final iframe result:', inIframe);
    setIsInIframe(inIframe);

    // If NOT in iframe, aggressively clear any cached embed data
    if (!inIframe) {
      console.log('[useExternalCounts] DEFINITELY not in iframe - clearing ALL embed data');
      localStorage.removeItem('pinkwizard-external-counts');
      localStorage.removeItem('pinkwizard-iframe-mode'); // Clear any other cached state
      setIsEmbeddedMode(false);
      setCounts(null);
      
      // Force a state update to ensure components see the change
      setTimeout(() => {
        setIsInIframe(false);
        setIsEmbeddedMode(false);
      }, 100);
      
      return;
    }

    // Only load cached counts if we're actually in an iframe
    const cachedCounts = localStorage.getItem('pinkwizard-external-counts');
    if (cachedCounts) {
      try {
        const parsedCounts = JSON.parse(cachedCounts) as ExternalOutreachCounts;
        setCounts(parsedCounts);
        setIsEmbeddedMode(true);
        console.log('[useExternalCounts] Loaded cached counts:', parsedCounts);
      } catch (error) {
        console.error('[useExternalCounts] Failed to parse cached counts:', error);
      }
    }

    // Listen for storage changes (when ExternalCountsBridge updates localStorage)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pinkwizard-external-counts' && event.newValue) {
        try {
          const parsedCounts = JSON.parse(event.newValue) as ExternalOutreachCounts;
          setCounts(parsedCounts);
          setIsEmbeddedMode(true);
          console.log('[useExternalCounts] Updated counts from storage:', parsedCounts);
        } catch (error) {
          console.error('[useExternalCounts] Failed to parse external counts from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getCountsForDay = (day: number) => {
    if (!counts || counts.day !== day) {
      return null;
    }
    return counts;
  };

  const getTodaysCounts = () => {
    if (!counts) return null;
    return counts;
  };

  return {
    counts,
    isInIframe,
    isEmbeddedMode,
    getCountsForDay,
    getTodaysCounts,
  };
};