import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const SessionBridge: React.FC = () => {
  const { session } = useAuth();
  const [isInIframe, setIsInIframe] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'listening' | 'connected'>('idle');
  const [lastTokenUpdate, setLastTokenUpdate] = useState<number>(0);

  useEffect(() => {
    const inIframe = window.parent !== window;
    setIsInIframe(inIframe);
    
    if (!inIframe) {
      return; // No session bridge needed for standalone mode
    }

    setBridgeStatus('listening');

    // Get parent origin from document.referrer for security
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : null;
    const allowedOrigins = [
      'https://pink-wizard.com',
      'https://mbp-holiday-75hard.lovable.app'
    ];

    const isOriginAllowed = (origin: string) => {
      return allowedOrigins.includes(origin);
    };

    // Simplified message handler - child only receives SSO_TOKEN_RESPONSE
    const handleMessage = async (event: MessageEvent) => {
      if (!isOriginAllowed(event.origin)) {
        return;
      }

      const { type, payload } = event.data;

      if (type === 'SSO_TOKEN_RESPONSE') {
        const now = Date.now();
        
        // Cooldown check - don't process tokens too frequently
        if (now - lastTokenUpdate < 30000) { // 30 second cooldown
          console.log('🔒 SSO token ignored - cooldown period');
          return;
        }
        
        // Only set session if we don't have one or current expires soon
        if (session?.access_token) {
          try {
            // Check if current token expires within 5 minutes
            const tokenData = JSON.parse(atob(session.access_token.split('.')[1]));
            const expiresAt = tokenData.exp * 1000; // Convert to milliseconds
            const fiveMinutes = 5 * 60 * 1000;
            
            if (expiresAt - now > fiveMinutes) {
              console.log('🔒 SSO token ignored - current session still valid');
              setBridgeStatus('connected');
              return;
            }
          } catch (e) {
            console.warn('⚠️ Could not parse current token expiry, proceeding with update');
          }
        }

        console.log('📥 Setting new session from parent');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: payload.access_token,
            refresh_token: payload.refresh_token
          });
          
          if (error) {
            console.error('❌ Session setup failed:', error);
            return;
          }
          
          setLastTokenUpdate(now);
          setBridgeStatus('connected');
        } catch (error) {
          console.error('❌ SSO token handling failed:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Only request SSO token if we don't have a session and origin is allowed
    if (!session && parentOrigin && allowedOrigins.includes(parentOrigin)) {
      console.log('🔌 Requesting SSO token from parent');
      window.parent.postMessage({ type: 'REQUEST_SSO_TOKEN' }, parentOrigin);
    } else if (session) {
      setBridgeStatus('connected');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Run only once on mount

  // Bridge status indicator removed from view
  return null;
};