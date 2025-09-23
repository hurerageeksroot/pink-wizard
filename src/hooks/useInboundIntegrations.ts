import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface InboundToken {
  id: string;
  token_name: string;
  token_preview: string;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  scopes: ('inbound' | 'outbound')[];
}

export function useInboundIntegrations() {
  const [tokens, setTokens] = useState<InboundToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const loadTokens = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integration_inbound_tokens')
        .select('id, token_name, token_preview, is_active, last_used_at, usage_count, created_at, scopes')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens((data || []).map(token => ({
        ...token,
        scopes: (token.scopes || ['inbound']) as ('inbound' | 'outbound')[]
      })));
    } catch (error) {
      console.error('Error loading inbound tokens:', error);
      toast({
        title: "Error",
        description: "Failed to load inbound integration tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async (tokenName: string) => {
    if (!user) return null;

    setCreating(true);
    try {
      // Generate a secure random token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Create hash for storage
      const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const tokenHashHex = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data, error } = await supabase
        .from('integration_inbound_tokens')
        .insert({
          user_id: user.id,
          token_name: tokenName,
          token_hash: tokenHashHex,
          token_preview: token.substring(0, 8) + '...'
        })
        .select('id, token_name, token_preview, is_active, last_used_at, usage_count, created_at, scopes')
        .single();

      if (error) throw error;

      setTokens(prev => [{
        ...data,
        scopes: (data.scopes || ['inbound']) as ('inbound' | 'outbound')[]
      }, ...prev]);
      
      toast({
        title: "Token Generated",
        description: "Your inbound integration token has been created successfully",
      });

      return token; // Return the actual token for one-time display
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Error",
        description: "Failed to generate inbound integration token",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const toggleToken = async (tokenId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('integration_inbound_tokens')
        .update({ is_active: isActive })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.map(token => 
        token.id === tokenId ? { ...token, is_active: isActive } : token
      ));

      toast({
        title: isActive ? "Token Activated" : "Token Deactivated",
        description: `The token has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling token:', error);
      toast({
        title: "Error",
        description: "Failed to update token status",
        variant: "destructive",
      });
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('integration_inbound_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.filter(token => token.id !== tokenId));
      
      toast({
        title: "Token Deleted",
        description: "The inbound integration token has been deleted",
      });
    } catch (error) {
      console.error('Error deleting token:', error);
      toast({
        title: "Error",
        description: "Failed to delete token",
        variant: "destructive",
      });
    }
  };

  const updateTokenScopes = async (tokenId: string, scopes: ('inbound' | 'outbound')[]) => {
    try {
      const { error } = await supabase
        .from('integration_inbound_tokens')
        .update({ scopes })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.map(token => 
        token.id === tokenId ? { ...token, scopes } : token
      ));

      toast({
        title: "Token Updated",
        description: "Token permissions have been updated successfully",
      });
    } catch (error) {
      console.error('Error updating token scopes:', error);
      toast({
        title: "Error",
        description: "Failed to update token permissions",
        variant: "destructive",
      });
    }
  };

  const testInboundWebhook = async (token: string, testData?: any) => {
    try {
      const webhookUrl = `https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-inbound`;
      
      const testPayload = testData || {
        email: 'test@example.com',
        name: 'Test Contact',
        company: 'Test Company',
        source: 'webhook_test'
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Inbound Test Successful",
          description: "The inbound webhook is working correctly",
        });
        return { success: true, data: result };
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Error testing inbound webhook:', error);
      toast({
        title: "Inbound Test Failed",
        description: error instanceof Error ? error.message : "Failed to test inbound webhook",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const testOutboundAPI = async (token: string, resource: string = 'contacts') => {
    try {
      const apiUrl = `https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-outbound?resource=${resource}&limit=1`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Outbound Test Successful",
          description: `Retrieved ${result.count} ${resource} successfully`,
        });
        return { success: true, data: result };
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Error testing outbound API:', error);
      toast({
        title: "Outbound Test Failed",
        description: error instanceof Error ? error.message : "Failed to test outbound API",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (user) {
      loadTokens();
    }
  }, [user]);

  return {
    tokens,
    loading,
    creating,
    generateToken,
    toggleToken,
    deleteToken,
    updateTokenScopes,
    testInboundWebhook,
    testOutboundAPI,
    refetch: loadTokens
  };
}