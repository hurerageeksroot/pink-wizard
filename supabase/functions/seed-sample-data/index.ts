import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from JWT token for authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'No authorization header - admin access required' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'User not authenticated' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabaseService
      .rpc('is_admin', { user_id_param: user.id });

    if (adminError || !adminCheck) {
      return new Response(JSON.stringify({ 
        error: 'Admin access required' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Get the target user by email
    const { data: users, error: userError2 } = await supabaseService.auth.admin.listUsers();
    if (userError2) throw userError2;

    const targetUser = users.users.find(user => user.email === 'hello@mobilebevpros.com');
    if (!targetUser) {
      return new Response(JSON.stringify({ 
        error: 'Target user hello@mobilebevpros.com not found' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log('Found target user:', targetUser.id);

    // Check if sample data already exists
    const { data: existingContacts, error: checkError } = await supabaseService
      .from('contacts')
      .select('id')
      .eq('user_id', targetUser.id)
      .limit(1);

    if (checkError) throw checkError;

    if (existingContacts && existingContacts.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Sample data already exists for this user',
        contactCount: existingContacts.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Insert sample contacts
    const sampleContacts = [
      {
        user_id: targetUser.id,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        company: 'TechCorp Solutions',
        position: 'Marketing Director',
        phone: '+1 (555) 123-4567',
        linkedin_url: 'https://linkedin.com/in/sarahjohnson',
        status: 'warm',
        relationship_type: 'lead',
        category: 'corporate_planner',
        source: 'LinkedIn Outreach',
        notes: 'Interested in our Q2 campaign. Has budget allocated.',
        response_received: true,
        total_touchpoints: 3,
        booking_scheduled: false,
        archived: false,
        last_contact_date: '2024-01-20T14:30:00Z',
        next_follow_up: '2024-02-01T09:00:00Z'
      },
      {
        user_id: targetUser.id,
        name: 'Michael Chen',
        email: 'm.chen@innovate.io',
        company: 'Innovate.io',
        position: 'CEO',
        status: 'hot',
        relationship_type: 'past_client',
        category: 'venue',
        source: 'Website Contact Form',
        notes: 'Ready to move forward. Scheduled demo for next week.',
        response_received: true,
        total_touchpoints: 5,
        booking_scheduled: true,
        archived: false,
        last_contact_date: '2024-01-22T16:45:00Z',
        next_follow_up: '2024-01-25T11:00:00Z'
      },
      {
        user_id: targetUser.id,
        name: 'Emma Rodriguez',
        email: 'emma@creativestudio.com',
        company: 'Creative Studio',
        position: 'Event Coordinator',
        phone: '+1 (555) 987-6543',
        linkedin_url: 'https://linkedin.com/in/emmarodriguez',
        status: 'cold',
        relationship_type: 'lead',
        category: 'wedding_planner',
        source: 'Industry Conference',
        notes: 'Met at the conference. Interested but needs more information.',
        response_received: false,
        total_touchpoints: 2,
        booking_scheduled: false,
        archived: false,
        last_contact_date: '2024-01-12T13:20:00Z',
        next_follow_up: '2024-01-30T10:00:00Z'
      }
    ];

    const { data: insertedContacts, error: contactsError } = await supabaseService
      .from('contacts')
      .insert(sampleContacts)
      .select('id, email');

    if (contactsError) throw contactsError;

    console.log('Inserted contacts:', insertedContacts?.length);

    // Insert sample activities
    if (insertedContacts && insertedContacts.length > 0) {
      const sarahContact = insertedContacts.find(c => c.email === 'sarah.johnson@techcorp.com');
      const michaelContact = insertedContacts.find(c => c.email === 'm.chen@innovate.io');

      if (sarahContact && michaelContact) {
        const sampleActivities = [
          {
            user_id: targetUser.id,
            contact_id: sarahContact.id,
            type: 'email',
            title: 'Initial Outreach Email',
            description: 'Sent introduction email about our services',
            response_received: true,
            completed_at: '2024-01-15T10:00:00Z'
          },
          {
            user_id: targetUser.id,
            contact_id: sarahContact.id,
            type: 'call',
            title: 'Follow-up Call',
            description: 'Called to discuss project requirements and timeline',
            response_received: true,
            scheduled_for: '2024-01-20T14:30:00Z',
            completed_at: '2024-01-20T14:30:00Z'
          },
          {
            user_id: targetUser.id,
            contact_id: michaelContact.id,
            type: 'meeting',
            title: 'Project Demo Meeting',
            description: 'Scheduled virtual meeting to demonstrate capabilities',
            response_received: false,
            scheduled_for: '2024-01-25T11:00:00Z'
          }
        ];

        const { error: activitiesError } = await supabaseService
          .from('activities')
          .insert(sampleActivities);

        if (activitiesError) throw activitiesError;

        console.log('Inserted activities:', sampleActivities.length);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Sample CRM data seeded successfully',
      contactsCreated: insertedContacts?.length || 0,
      userId: targetUser.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error seeding sample data:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});