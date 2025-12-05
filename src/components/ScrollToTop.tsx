import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathnameRef = useRef<string>('');

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    
    // Only scroll if the pathname actually changed (not just query params or hash)
    if (previousPathname === pathname) {
      return;
    }

    // Skip scrolling if user is actively interacting with forms or dialogs
    const activeElement = document.activeElement;
    const isFormInteraction = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    // Skip scrolling if a dialog or modal is open
    const hasOpenDialog = document.querySelector('[role="dialog"]') ||
      document.querySelector('.dialog-content') ||
      document.querySelector('[data-state="open"]');

    // Skip scrolling if user just opened a dropdown or popover
    const hasOpenPopover = document.querySelector('[data-state="open"][role="menu"]') ||
      document.querySelector('[data-state="open"][role="listbox"]') ||
      document.querySelector('.popover-content');

    if (isFormInteraction || hasOpenDialog || hasOpenPopover) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Debounce the scroll to prevent rapid scrolling during navigation
    const timeoutId = setTimeout(() => {
      // Double-check that we're still on the same route and no interactions started
      if (window.location.pathname === pathname && !document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) {
        window.scrollTo(0, 0);
      }
    }, 100);

    previousPathnameRef.current = pathname;

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}