import { supabase } from '@/integrations/supabase/client';

export const seedSampleDataForUser = async (userId: string, userEmail: string) => {
  // Seed sample data for ALL users for proper onboarding
  console.log('[seedData] Seeding sample data for user:', userEmail);

  try {
    // Check if user already has contacts (avoid duplicate seeding)
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      console.log('Sample data already exists for user');
      return false;
    }

    // Insert sample contacts
    const sampleContacts = [
      {
        user_id: userId,
        name: 'Sarah Johnson',
        email: 'demo.sarah@example-demo-data.com',
        company: 'TechCorp Solutions',
        position: 'Marketing Director',
        phone: '+1 (555) 123-4567',
        linkedin_url: 'https://linkedin.com/in/sarahjohnson',
        status: 'warm',
        relationship_type: 'lead',
        category: 'corporate_planner',
        source: 'LinkedIn Outreach (Demo Data)',
        notes: 'Interested in our Q2 campaign. Has budget allocated. [DEMO DATA]',
        response_received: true,
        total_touchpoints: 3,
        booking_scheduled: false,
        archived: false,
        last_contact_date: '2024-01-20T14:30:00Z',
        next_follow_up: null // Remove follow-up dates for demo data
      },
      {
        user_id: userId,
        name: 'Michael Chen',
        email: 'demo.michael@example-demo-data.com',
        company: 'Innovate.io',
        position: 'CEO',
        status: 'hot',
        relationship_type: 'past_client',
        category: 'venue',
        source: 'Website Contact Form (Demo Data)',
        notes: 'Ready to move forward. Scheduled demo for next week. [DEMO DATA]',
        response_received: true,
        total_touchpoints: 5,
        booking_scheduled: true,
        archived: false,
        last_contact_date: '2024-01-22T16:45:00Z',
        next_follow_up: null // Remove follow-up dates for demo data
      },
      {
        user_id: userId,
        name: 'Emma Rodriguez',
        email: 'demo.emma@example-demo-data.com',
        company: 'Creative Studio',
        position: 'Event Coordinator',
        phone: '+1 (555) 987-6543',
        linkedin_url: 'https://linkedin.com/in/emmarodriguez',
        status: 'cold',
        relationship_type: 'lead',
        category: 'wedding_planner',
        source: 'Industry Conference (Demo Data)',
        notes: 'Met at the conference. Interested but needs more information. [DEMO DATA]',
        response_received: false,
        total_touchpoints: 2,
        booking_scheduled: false,
        archived: false,
        last_contact_date: '2024-01-12T13:20:00Z',
        next_follow_up: null // Remove follow-up dates for demo data
      }
    ];

    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(sampleContacts)
      .select('id, email');

    if (contactsError) throw contactsError;

    // Insert sample activities for all contacts with touchpoints
    if (insertedContacts && insertedContacts.length > 0) {
      const sampleActivities = [];

      // Sarah Johnson (3 touchpoints)
      const sarahContact = insertedContacts.find(c => c.email === 'demo.sarah@example-demo-data.com');
      if (sarahContact) {
        sampleActivities.push(
          {
            user_id: userId,
            contact_id: sarahContact.id,
            type: 'email',
            title: 'Initial LinkedIn Outreach',
            description: 'Connected and sent message about our services',
            response_received: true,
            completed_at: '2024-01-15T10:00:00Z'
          },
          {
            user_id: userId,
            contact_id: sarahContact.id,
            type: 'call',
            title: 'Discovery Call',
            description: 'Called to discuss Q2 campaign requirements',
            response_received: true,
            scheduled_for: '2024-01-20T14:30:00Z',
            completed_at: '2024-01-20T14:30:00Z'
          },
          {
            user_id: userId,
            contact_id: sarahContact.id,
            type: 'email',
            title: 'Proposal Follow-up',
            description: 'Sent detailed proposal and pricing',
            response_received: true,
            completed_at: '2024-01-22T09:00:00Z'
          }
        );
      }

      // Michael Chen (5 touchpoints)
      const michaelContact = insertedContacts.find(c => c.email === 'demo.michael@example-demo-data.com');
      if (michaelContact) {
        sampleActivities.push(
          {
            user_id: userId,
            contact_id: michaelContact.id,
            type: 'email',
            title: 'Website Form Response',
            description: 'Responded to their website contact form inquiry',
            response_received: true,
            completed_at: '2024-01-18T09:00:00Z'
          },
          {
            user_id: userId,
            contact_id: michaelContact.id,
            type: 'call',
            title: 'Initial Consultation',
            description: 'Discussed project scope and timeline',
            response_received: true,
            completed_at: '2024-01-19T11:00:00Z'
          },
          {
            user_id: userId,
            contact_id: michaelContact.id,
            type: 'meeting',
            title: 'Strategy Session',
            description: 'In-person meeting to finalize approach',
            response_received: true,
            completed_at: '2024-01-21T14:00:00Z'
          },
          {
            user_id: userId,
            contact_id: michaelContact.id,
            type: 'email',
            title: 'Contract Draft',
            description: 'Sent contract draft for review',
            response_received: true,
            completed_at: '2024-01-22T10:00:00Z'
          },
          {
            user_id: userId,
            contact_id: michaelContact.id,
            type: 'meeting',
            title: 'Demo Scheduled',
            description: 'Scheduled product demo for next week',
            response_received: true,
            scheduled_for: '2024-01-25T11:00:00Z',
            completed_at: '2024-01-22T16:45:00Z'
          }
        );
      }

      // Emma Rodriguez (2 touchpoints)  
      const emmaContact = insertedContacts.find(c => c.email === 'demo.emma@example-demo-data.com');
      if (emmaContact) {
        sampleActivities.push(
          {
            user_id: userId,
            contact_id: emmaContact.id,
            type: 'meeting',
            title: 'Conference Connection',
            description: 'Met at industry conference booth',
            response_received: false,
            completed_at: '2024-01-12T09:00:00Z'
          },
          {
            user_id: userId,
            contact_id: emmaContact.id,
            type: 'email',
            title: 'Post-Conference Follow-up',
            description: 'Sent follow-up email with service information',
            response_received: false,
            completed_at: '2024-01-12T13:20:00Z'
          }
        );
      }

      if (sampleActivities.length > 0) {
        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(sampleActivities);

        if (activitiesError) throw activitiesError;
      }
    }

    console.log('Sample CRM data seeded successfully for', userEmail);
    return true;
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return false;
  }
};