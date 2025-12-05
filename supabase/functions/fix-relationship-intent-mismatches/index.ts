import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FixResult {
  contactId: string;
  contactName: string;
  oldIntent: string;
  newIntent: string;
  oldStatus: string;
  newStatus: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Fixing relationship intent mismatches for user:', user.id);

    // Get user's relationship type configurations
    const { data: relationshipTypes, error: typesError } = await supabaseClient
      .from('user_relationship_types')
      .select('name, relationship_intent, default_status')
      .eq('user_id', user.id);

    if (typesError) {
      console.error('Failed to fetch relationship types:', typesError);
      throw new Error('Failed to fetch relationship types');
    }

    if (!relationshipTypes || relationshipTypes.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No relationship types configured',
          fixedCount: 0,
          fixes: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a map of relationship_type -> correct intent
    const typeToIntentMap = new Map(
      relationshipTypes.map(rt => [rt.name, { intent: rt.relationship_intent, defaultStatus: rt.default_status }])
    );

    console.log('📋 Relationship type configurations:', Object.fromEntries(typeToIntentMap));

    // Find all contacts with intent mismatches for this user
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, name, relationship_type, relationship_intent, relationship_status')
      .eq('user_id', user.id);

    if (contactsError) {
      console.error('Failed to fetch contacts:', contactsError);
      throw new Error('Failed to fetch contacts');
    }

    console.log(`📊 Checking ${contacts?.length || 0} contacts for intent mismatches`);

    const fixes: FixResult[] = [];
    const errors: string[] = [];

    if (contacts) {
      for (const contact of contacts) {
        const correctConfig = typeToIntentMap.get(contact.relationship_type);
        
        if (!correctConfig) {
          console.warn(`⚠️ Contact ${contact.id} has invalid relationship type: ${contact.relationship_type}`);
          continue;
        }

        // Check if intent matches
        if (contact.relationship_intent !== correctConfig.intent) {
          console.log(`🔧 Fixing contact ${contact.id} (${contact.name}):`, {
            relationshipType: contact.relationship_type,
            currentIntent: contact.relationship_intent,
            correctIntent: correctConfig.intent,
            currentStatus: contact.relationship_status,
            defaultStatus: correctConfig.defaultStatus
          });

          // Get valid statuses for the correct intent
          const { data: statusConfigs, error: statusError } = await supabaseClient
            .from('relationship_status_configs')
            .select('status_key')
            .eq('intent', correctConfig.intent)
            .eq('user_id', user.id);

          if (statusError) {
            console.error('Failed to fetch status configs:', statusError);
            errors.push(`Failed to validate status for contact ${contact.id}`);
            continue;
          }

          const validStatusKeys = statusConfigs?.map(s => s.status_key) || [];
          const isStatusValid = validStatusKeys.includes(contact.relationship_status || '');

          // Determine final status
          const finalStatus = isStatusValid ? contact.relationship_status : correctConfig.defaultStatus;

          // Update the contact
          const { error: updateError } = await supabaseClient
            .from('contacts')
            .update({
              relationship_intent: correctConfig.intent,
              relationship_status: finalStatus
            })
            .eq('id', contact.id);

          if (updateError) {
            console.error(`Failed to update contact ${contact.id}:`, updateError);
            errors.push(`Failed to update contact ${contact.name}: ${updateError.message}`);
          } else {
            fixes.push({
              contactId: contact.id,
              contactName: contact.name,
              oldIntent: contact.relationship_intent || 'none',
              newIntent: correctConfig.intent,
              oldStatus: contact.relationship_status || 'none',
              newStatus: finalStatus
            });
            console.log(`✅ Fixed contact ${contact.id} (${contact.name})`);
          }
        }
      }
    }

    console.log(`✅ Fixed ${fixes.length} contacts, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        fixedCount: fixes.length,
        fixes,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in fix-relationship-intent-mismatches:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
