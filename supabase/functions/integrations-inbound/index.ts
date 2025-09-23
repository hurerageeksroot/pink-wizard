import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactData {
  email: string;
  name?: string;
  company?: string;
  position?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  linkedin_url?: string;
  website_url?: string;
  status?: 'none' | 'cold' | 'warm' | 'hot' | 'won' | 'lost_maybe_later' | 'lost_not_fit';
  relationship_type?: 'lead' | 'lead_amplifier' | 'past_client' | 'friend_family' | 'associate_partner' | 'referral_source' | 'booked_client';
  category?: string;
  source?: string;
  notes?: string;
  social_media_links?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHashHex = Array.from(new Uint8Array(tokenHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Validate token and get user_id
    const { data: tokenData, error: tokenError } = await supabase
      .from('integration_inbound_tokens')
      .select('user_id, is_active, usage_count')
      .eq('token_hash', tokenHashHex)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError);
      return new Response(JSON.stringify({ error: 'Invalid or inactive token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const contactData: ContactData = body;

    // Validate required fields
    if (!contactData.email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare contact data with defaults
    const contactPayload = {
      user_id: tokenData.user_id,
      email: contactData.email.toLowerCase().trim(),
      name: contactData.name || 'Unknown',
      company: contactData.company || null,
      position: contactData.position || null,
      phone: contactData.phone || null,
      address: contactData.address || null,
      city: contactData.city || null,
      state: contactData.state || null,
      zip_code: contactData.zip_code || null,
      country: contactData.country || null,
      linkedin_url: contactData.linkedin_url || null,
      website_url: contactData.website_url || null,
      status: contactData.status || 'cold',
      relationship_type: contactData.relationship_type || 'lead',
      category: contactData.category || 'other',
      source: contactData.source || 'inbound_integration',
      notes: contactData.notes || null,
      social_media_links: contactData.social_media_links || {},
      response_received: false,
      total_touchpoints: 0,
      booking_scheduled: false,
      archived: false,
      is_demo: false,
      revenue_amount: 0,
    };

    // Upsert contact (insert or update if email exists for this user)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(contactPayload, {
        onConflict: 'user_id,email',
        ignoreDuplicates: false
      })
      .select('id, name, email')
      .single();

    if (contactError) {
      console.error('Contact upsert failed:', contactError);
      return new Response(JSON.stringify({ error: 'Failed to create/update contact' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update token usage
    await supabase
      .from('integration_inbound_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: tokenData.usage_count + 1
      })
      .eq('token_hash', tokenHashHex);

    console.log(`✅ Contact processed via inbound integration:`, {
      contact_id: contact.id,
      email: contact.email,
      user_id: tokenData.user_id
    });

    return new Response(JSON.stringify({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in integrations-inbound function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});