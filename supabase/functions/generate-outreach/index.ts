import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Maps user-friendly desire/fear selections to buyer profile emphasis
 * Returns which profile to emphasize in messaging
 */
function getBuyerProfileEmphasis(
  coreDesire?: string,
  coreFear?: string
): 'dreamer' | 'lover' | 'scholar' | 'boss' | 'balanced' {
  // If both are "not sure", return balanced
  if ((!coreDesire || coreDesire === 'not_sure') && 
      (!coreFear || coreFear === 'not_sure')) {
    return 'balanced';
  }

  // Scoring system: each selection adds points to corresponding profile
  const scores = {
    dreamer: 0,
    lover: 0,
    scholar: 0,
    boss: 0
  };

  // Map desires to profiles
  switch (coreDesire) {
    case 'breakthrough':
      scores.dreamer += 2; // Transformation
      break;
    case 'relationships':
      scores.lover += 2; // Belonging & connection
      break;
    case 'informed_decisions':
      scores.scholar += 2; // Understanding
      break;
    case 'achieve_goals':
      scores.boss += 2; // Achievement
      break;
  }

  // Map fears to profiles
  switch (coreFear) {
    case 'plateauing':
      scores.dreamer += 2; // Fear of stagnation
      break;
    case 'missing_connections':
      scores.lover += 2; // Fear of exclusion
      break;
    case 'wrong_choice':
      scores.scholar += 2; // Fear of mistakes
      break;
    case 'wasting_time':
      scores.boss += 2; // Fear of failure
      break;
  }

  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  
  // If no clear winner (all zeros or tie), return balanced
  if (maxScore === 0) return 'balanced';

  // Return profile with highest score
  for (const [profile, score] of Object.entries(scores)) {
    if (score === maxScore) {
      return profile as 'dreamer' | 'lover' | 'scholar' | 'boss';
    }
  }

  return 'balanced';
}

/**
 * Returns a natural language description of the detected motivation
 */
function getMotivationDescription(profile: string): string {
  switch (profile) {
    case 'dreamer':
      return "This person is motivated by breakthrough and transformation. They're seeking new experiences and are energized by possibility and change.";
    case 'lover':
      return "This person is motivated by relationships and connection. They value belonging, community, and being understood by like-minded peers.";
    case 'scholar':
      return "This person is motivated by understanding and knowledge. They need comprehensive information and want to make informed, intelligent decisions.";
    case 'boss':
      return "This person is motivated by achievement and results. They're focused on specific goals, efficiency, and measurable outcomes.";
    default:
      return "Buyer motivation unclear - appeal to all psychological profiles equally.";
  }
}

/**
 * Returns specific emphasis instructions for the AI based on detected profile
 */
function getEmphasisInstructions(profile: string): string {
  switch (profile) {
    case 'dreamer':
      return `
CRITICAL EMPHASIS: DREAMER PROFILE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY MESSAGING FOCUS (60% of content):
- Lead with transformation and breakthrough language
- Use vivid, sensory, aspirational language
- Paint "before & after" scenarios
- Emphasize novelty, excitement, and "what if" possibilities
- Use power words: Imagine, Transform, Unlock, Discover, Revolutionary
- Future-pace their ideal reality
- Contrast "new way" vs "old broken methods"

SECONDARY (40% - Still include for completeness):
- Include some data/proof for credibility (Scholar)
- Mention community/success stories briefly (Lover)  
- Include clear outcomes/ROI (Boss)

AVOID:
- Boring, dry, corporate language
- Too much detail without vision
- Focusing only on process without transformation`;

    case 'lover':
      return `
CRITICAL EMPHASIS: LOVER PROFILE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY MESSAGING FOCUS (60% of content):
- Lead with empathy and understanding ("You're not alone...")
- Emphasize community, belonging, shared values
- Use warm, inclusive language: "Welcome," "Join," "Together," "Our family"
- Reference others like them who are thriving
- Show you understand their unique challenges
- Create a sense of "finding your people"
- Use testimonials about community and connection

SECONDARY (40% - Still include for completeness):
- Include transformation potential (Dreamer)
- Provide some proof/data (Scholar)
- Mention results and efficiency (Boss)

AVOID:
- Cold, transactional language
- Pure data dumps without emotion
- Isolated individual achievement framing`;

    case 'scholar':
      return `
CRITICAL EMPHASIS: SCHOLAR PROFILE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY MESSAGING FOCUS (60% of content):
- Lead with "how it works" and clear mechanisms
- Provide comprehensive details and data
- Use power words: Proven, Data, Science, System, Blueprint, Guaranteed
- Explain the methodology and logic
- Include statistics, case studies, research
- Address "But how?" questions proactively
- Emphasize risk removal (guarantees, trials)
- Validate their intelligence for asking good questions

SECONDARY (40% - Still include for completeness):
- Show transformation is possible (Dreamer)
- Mention community/testimonials (Lover)
- Include ROI and efficiency (Boss)

AVOID:
- Vague claims without explanation
- High-pressure urgency tactics
- Hype without substance
- Leaving questions unanswered`;

    case 'boss':
      return `
CRITICAL EMPHASIS: BOSS PROFILE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY MESSAGING FOCUS (60% of content):
- Lead with specific, measurable outcomes
- Use direct, efficient language
- Emphasize speed to result and ROI
- Use power words: Achieve, Master, Results, Fast, Ultimate, Elite, Dominate
- Include hard numbers and concrete metrics
- Focus on the goal/achievement
- Frame as a "proven system" or "blueprint"
- Highlight premium value and exclusivity

SECONDARY (40% - Still include for completeness):
- Mention transformation potential (Dreamer)
- Include proof/data (Scholar)
- Reference successful peers (Lover)

AVOID:
- Lengthy explanations without clear outcomes
- Emotional language without metrics
- Vague promises
- Wasting their time with fluff`;

    default:
      return `
BALANCED APPROACH: ALL PROFILES EQUALLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Distribute messaging evenly across all four buyer profiles:
- 25% Dreamer (transformation, novelty, excitement)
- 25% Lover (connection, belonging, community)
- 25% Scholar (data, proof, how it works)
- 25% Boss (results, ROI, achievement)

Structure: Hook (Dreamer+Boss) → Mechanism (Scholar+Lover) → Close (All Four)`;
  }
}

/**
 * Helper function to calculate days until a date
 */
function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Helper function to format date nicely
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GENERATE-OUTREACH] Function started');

    if (!openAIApiKey) {
      console.error('[GENERATE-OUTREACH] OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authentication token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[GENERATE-OUTREACH] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('[GENERATE-OUTREACH] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[GENERATE-OUTREACH] User authenticated:', { userId: user.id, email: user.email });

    // Check if user is a challenge participant (gets unlimited quota)
    const { data: isParticipant, error: participantError } = await supabase
      .rpc('user_is_challenge_participant', { user_id_param: user.id });

    if (participantError) {
      console.error('[GENERATE-OUTREACH] Error checking participant status:', participantError);
    }

    console.log('[GENERATE-OUTREACH] Challenge participant status:', { isParticipant });

    // Challenge participants get unlimited quota
    if (isParticipant) {
      console.log('[GENERATE-OUTREACH] User is challenge participant - unlimited quota granted');
      // Skip quota checks for challenge participants
    } else {
      // Check user's AI quota before proceeding
      const { data: rawQuotaData, error: quotaError } = await supabase
        .rpc('get_my_ai_quota');

      if (quotaError) {
        console.error('[GENERATE-OUTREACH] Error checking quota:', quotaError);
        return new Response(
          JSON.stringify({ error: 'Error checking AI quota' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle both array and single object responses from RPC
      let quotaData = null;
      if (Array.isArray(rawQuotaData) && rawQuotaData.length > 0) {
        quotaData = rawQuotaData[0];
      } else if (rawQuotaData && !Array.isArray(rawQuotaData)) {
        quotaData = rawQuotaData;
      }

      // If no quota data found, use default Free tier values
      const effectiveQuota = quotaData || {
        tier: 'Free',
        monthly_quota: 10000,
        monthly_used: 0,
        credits_remaining: 0,
        per_request_limit: 1500,
        remaining: 10000
      };

      console.log('[GENERATE-OUTREACH] User quota:', {
        tier: effectiveQuota.tier,
        remaining: effectiveQuota.remaining,
        perRequestLimit: effectiveQuota.per_request_limit
      });

      // Check if user has remaining tokens
      if (effectiveQuota.remaining <= 0) {
        console.log('[GENERATE-OUTREACH] User quota exhausted');
        return new Response(
          JSON.stringify({ 
            error: 'AI quota exhausted',
            quota: effectiveQuota,
            message: 'You have reached your monthly AI token limit. Please upgrade your plan or purchase additional tokens.'
          }),
          { 
            status: 402, // Payment required
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if this request would exceed per-request limit
      const estimatedTokens = 1500; // Conservative estimate for outreach generation
      if (estimatedTokens > effectiveQuota.per_request_limit) {
        console.log('[GENERATE-OUTREACH] Request exceeds per-request limit');
        return new Response(
          JSON.stringify({ 
            error: 'Request too large',
            quota: effectiveQuota,
            message: `This request would use approximately ${estimatedTokens} tokens, which exceeds your per-request limit of ${effectiveQuota.per_request_limit} tokens.`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }


    // Define validation schema
    const RequestSchema = z.object({
      contactId: z.string().uuid().nullable().optional(),
      contactName: z.string().max(200).nullable().optional(),
      contactCompany: z.string().max(200).nullable().optional(),
      contactRole: z.string().max(200).nullable().optional(),
      outreachGoal: z.string().max(500).nullable().optional(),
      coreDesire: z.enum(['breakthrough', 'relationships', 'informed_decisions', 'achieve_goals', 'not_sure']).nullable().optional(),
      coreFear: z.enum(['plateauing', 'missing_connections', 'wrong_choice', 'wasting_time', 'not_sure']).nullable().optional(),
      campaignId: z.string().uuid().nullable().optional(),
      contactSpecificGoal: z.string().max(500).nullable().optional(),
      channel: z.enum(['email', 'linkedin', 'instagram', 'sms', 'other']).nullable().optional(),
      tone: z.enum(['professional', 'friendly', 'casual', 'enthusiastic']).nullable().optional()
    });

    const rawData = await req.json();
    const validationResult = RequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('[GENERATE-OUTREACH] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const requestData = validationResult.data;
    console.log('[GENERATE-OUTREACH] Request data validated');

    // Extract buyer motivation selectors
    const coreDesire = requestData.coreDesire;
    const coreFear = requestData.coreFear;

    // Determine buyer profile emphasis
    const profileEmphasis = getBuyerProfileEmphasis(coreDesire, coreFear);
    const motivationDescription = getMotivationDescription(profileEmphasis);
    const emphasisInstructions = getEmphasisInstructions(profileEmphasis);
    
    console.log('[GENERATE-OUTREACH] Buyer profile analysis:', {
      coreDesire,
      coreFear,
      profileEmphasis,
      motivationSummary: motivationDescription.substring(0, 100) + '...'
    });

    // Fetch campaign context if campaignId is provided
    let campaignContext = '';
    if (requestData.campaignId) {
      console.log('[GENERATE-OUTREACH] Fetching campaign data:', requestData.campaignId);
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaign_initiatives')
        .select('*')
        .eq('id', requestData.campaignId)
        .eq('user_id', user.id)
        .single();
        
      if (campaignError) {
        console.error('[GENERATE-OUTREACH] Error fetching campaign:', campaignError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to load campaign data',
            code: 'CAMPAIGN_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (campaign) {
        const isEvergreen = campaign.offer_type === 'evergreen';
        
        if (isEvergreen) {
          // Evergreen offer messaging
          campaignContext = `
EVERGREEN OFFER (ALWAYS AVAILABLE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Offer: ${campaign.name}
Offer Goals: ${campaign.campaign_goal}
${requestData.contactSpecificGoal ? `Specific Goal for This Contact: ${requestData.contactSpecificGoal}` : ''}

♾️ EVERGREEN VALUE PROPOSITION:
This is an ONGOING, ALWAYS-AVAILABLE offering. Emphasize:
- Long-term value and sustained benefits
- Flexibility and convenience ("whenever you're ready")
- Ongoing availability ("we're here when you need us")
- Relationship building over time
- No pressure, but always top-of-mind
- Educational/nurture approach
- Focus on fit and value, not urgency

VALUE PROPOSITION:
${campaign.value_proposition || 'N/A'}

KEY BENEFITS:
${campaign.key_benefits?.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'N/A'}

CALL TO ACTION:
${campaign.call_to_action || 'Learn more or schedule a conversation'}

TONE: ${campaign.tone || 'professional'} with a CONSULTATIVE, HELPFUL approach
URGENCY LEVEL: Low/None - focus on value, fit, and building trust over time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        } else {
          // Time-bound campaign messaging
          campaignContext = `
ACTIVE CAMPAIGN INITIATIVE (TIME-BOUND):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Campaign: ${campaign.name}
Campaign Goals: ${campaign.campaign_goal}
${requestData.contactSpecificGoal ? `Specific Goal for This Contact: ${requestData.contactSpecificGoal}` : ''}

⏰ URGENCY FACTORS:
${campaign.event_date ? `Event Date: ${formatDate(campaign.event_date)} (${daysUntil(campaign.event_date)} days away)` : ''}
${campaign.deadline_date ? `RSVP Deadline: ${formatDate(campaign.deadline_date)} (${daysUntil(campaign.deadline_date)} days to respond)` : ''}
${campaign.event_location ? `Location: ${campaign.event_location}` : ''}

CRITICAL: This is a TIME-SENSITIVE opportunity. Emphasize:
- Limited-time availability
- Specific deadlines and dates
- "Don't miss out" messaging
- Scarcity (seats, spots, early-bird pricing)
- Clear date references and urgency language
- Fear of missing out (FOMO)

VALUE PROPOSITION:
${campaign.value_proposition || 'N/A'}

KEY BENEFITS:
${campaign.key_benefits?.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'N/A'}

CALL TO ACTION:
${campaign.call_to_action || 'RSVP or register now'}

TONE: ${campaign.tone || 'professional'} with URGENCY and EXCITEMENT
URGENCY LEVEL: ${campaign.urgency_level || 'HIGH'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }
        console.log('[GENERATE-OUTREACH] Campaign context created');
      }
    }

    // Fetch touchpoint history if contactId is provided
    let touchpointContext = '';
    let researchContext = '';
    
    if (requestData.contactId) {
      console.log('[GENERATE-OUTREACH] Fetching touchpoint history for contact:', requestData.contactId);
      
      try {
        // Fetch recent activities for this contact
        const { data: activities, error: activitiesError } = await supabase
          .from('activities')
          .select('type, title, description, created_at, completed_at, response_received')
          .eq('contact_id', requestData.contactId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activitiesError) {
          console.error('[GENERATE-OUTREACH] Error fetching activities:', activitiesError);
        } else if (activities && activities.length > 0) {
          // Fetch contact details for additional context
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('name, company, status, relationship_type, category, notes, last_contact_date, total_touchpoints')
            .eq('id', requestData.contactId)
            .eq('user_id', user.id)
            .single();

          if (contactError) {
            console.error('[GENERATE-OUTREACH] Error fetching contact details:', contactError);
          }

          // Build touchpoint context
          const contactSummary = contact ? `
CONTACT PROFILE:
- Name: ${contact.name}
- Company: ${contact.company || 'N/A'}
- Status: ${contact.status}
- Relationship: ${contact.relationship_type}
- Category: ${contact.category}
- Total touchpoints: ${contact.total_touchpoints || 0}
- Last contact: ${contact.last_contact_date ? new Date(contact.last_contact_date).toLocaleDateString() : 'Never'}
- Notes: ${contact.notes || 'None'}
` : '';

          const touchpointSummary = activities.map((activity, index) => {
            const date = new Date(activity.completed_at || activity.created_at).toLocaleDateString();
            const responseStatus = activity.response_received ? ' (Response received)' : ' (No response)';
            
            // Parse structured description format
            let internalNotes = '';
            let contactStatements = '';
            
            if (activity.description) {
              if (activity.description.includes('CONTACT_STATEMENTS:')) {
                const parts = activity.description.split(' | ');
                for (const part of parts) {
                  if (part.startsWith('INTERNAL_NOTES:')) {
                    internalNotes = part.replace('INTERNAL_NOTES:', '').trim();
                  } else if (part.startsWith('CONTACT_STATEMENTS:')) {
                    contactStatements = part.replace('CONTACT_STATEMENTS:', '').trim();
                  }
                }
              } else {
                // Legacy format - treat as internal notes
                internalNotes = activity.description;
              }
            }
            
            let activityString = `${index + 1}. ${activity.type}: ${activity.title}${responseStatus} - ${date}`;
            
            // Only include contact statements in the context for AI (not internal notes)
            if (contactStatements) {
              activityString += `\n   Contact said/asked: "${contactStatements}"`;
            }
            
            return activityString;
          }).join('\n');

          touchpointContext = `
RECENT TOUCHPOINT HISTORY:
${contactSummary}
RECENT ACTIVITIES:
${touchpointSummary}

Based on this history, personalize the outreach to acknowledge previous interactions and build on the existing relationship context.`;
          
          console.log('[GENERATE-OUTREACH] Touchpoint context created:', touchpointContext);
        } else {
          touchpointContext = `
CONTACT STATUS: This appears to be a new contact with no previous touchpoint history. Focus on making a strong first impression.`;
        }
      } catch (error) {
        console.error('[GENERATE-OUTREACH] Error building touchpoint context:', error);
        // Continue without context if there's an error
      }

      // Fetch contact research data if available
      try {
        console.log('[GENERATE-OUTREACH] Checking for contact research data');
        const { data: researchData, error: researchError } = await supabase
          .from('contact_research')
          .select('research_data, status, created_at')
          .eq('contact_id', requestData.contactId)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (researchError) {
          console.error('[GENERATE-OUTREACH] Error fetching research data:', researchError);
        } else if (researchData?.research_data) {
          const research = researchData.research_data;
          console.log('[GENERATE-OUTREACH] Contact research data found:', research);
          
          researchContext = `
WEB RESEARCH INSIGHTS:
${research.bio ? `Professional Background: ${research.bio}` : ''}

Key Facts:
${research.keyFacts?.map((fact: string, index: number) => `${index + 1}. ${fact}`).join('\n') || 'None available'}

Conversation Starters:
${research.icebreakers?.map((icebreaker: string, index: number) => `${index + 1}. ${icebreaker}`).join('\n') || 'None available'}

Outreach Angles:
${research.outreachAngles?.map((angle: string, index: number) => `${index + 1}. ${angle}`).join('\n') || 'None available'}

${research.sources?.length ? `Data Sources: ${research.sources.length} web sources analyzed` : ''}

CRITICAL: Use these insights heavily in the generated content. Include at least 2-3 specific facts from the research in your outreach, and base at least one conversation starter on the icebreakers provided. Make the research integration obvious and valuable.`;

          console.log('[GENERATE-OUTREACH] Research context created');
        } else {
          console.log('[GENERATE-OUTREACH] No completed research data found for this contact');
        }
      } catch (error) {
        console.error('[GENERATE-OUTREACH] Error fetching research data:', error);
        // Continue without research context if there's an error
      }
    }

    // Build explicit contact relationship context
    let contactRelationshipContext = '';
    let contact = null;
    
    if (requestData.contactId && requestData.contactRelationshipType) {
      // Fetch contact if not already fetched
      if (!contact) {
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('name, company, status, relationship_type, category, notes, last_contact_date, total_touchpoints')
          .eq('id', requestData.contactId)
          .eq('user_id', user.id)
          .single();

        if (!contactError) {
          contact = contactData;
        }
      }

      const relationshipType = requestData.contactRelationshipType;
      const relationshipStatus = requestData.contactRelationshipStatus || contact?.status || 'unknown';
      const relationshipIntent = requestData.relationshipTypeData?.relationshipIntent || 'unknown';
      const outreachType = requestData.outreachType || 'cold';
      const contactName = requestData.contactName || contact?.name || 'Unknown';
      
      contactRelationshipContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CONTACT RELATIONSHIP CONTEXT - CRITICAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contact: ${contactName}
Relationship Type: ${relationshipType}
Current Status: ${relationshipStatus}
Intent Category: ${relationshipIntent}
Detected Outreach Type: ${outreachType.toUpperCase()}

`;

      // Add outreach-type-specific instructions
      if (outreachType === 'cold') {
        contactRelationshipContext += `
❄️ COLD OUTREACH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a COLD CONTACT - they have NO prior relationship with you.

CRITICAL RULES:
✅ DO:
- Establish credibility immediately (credentials, social proof)
- Focus on THEIR pain points and goals
- Lead with value proposition
- Use professional, respectful tone
- Include a clear, low-barrier call to action (15-min call, quick question)
- Reference any mutual connections or context if available
- Be concise and respect their time

❌ DO NOT:
- Assume they know who you are or what you do
- Reference past interactions that don't exist
- Use overly familiar language ("Great to reconnect", "As we discussed")
- Make it about you instead of them
- Ask for big commitments upfront
- Mention internal team members they don't know without context

${relationshipIntent === 'business_lead_statuses' ? `
LEAD-SPECIFIC APPROACH:
- Focus on business value and ROI
- Highlight how you solve their specific challenges
- Use case studies or results from similar clients
- Offer educational content or free resources
` : ''}

${campaignContext ? `
CAMPAIGN ALIGNMENT FOR COLD CONTACTS:
The campaign goal describes opportunities for MULTIPLE relationship types.
Since THIS contact is COLD, focus ONLY on:
- Introducing yourself and your value
- Sparking initial interest
- Getting a response or first meeting
- DO NOT mention sponsorship opportunities, partnership roles, or internal coordinators they don't know
- If the campaign mentions "past clients" or "partners," that's for OTHER contacts, not this one
` : ''}
`;
      } else if (outreachType === 'warm') {
        contactRelationshipContext += `
🤝 WARM OUTREACH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This contact has SOME familiarity with you (engaged lead, responded before, or personal connection).

CRITICAL RULES:
✅ DO:
- Reference previous interactions naturally ("Following up on...", "Building on our last conversation...")
- Show you remember context about them
- Move the relationship forward (next step, deeper engagement)
- Balance warmth with professionalism
- Acknowledge their previous interest or engagement
- Make it easy to say yes

❌ DO NOT:
- Treat them as a complete stranger
- Over-explain basics they already know
- Be too formal if relationship warrants friendliness
- Ignore previous context or conversations

${relationshipStatus === 'hot' ? `
🔥 HIGH PRIORITY - HOT LEAD:
This contact is highly engaged and ready to move forward!
- Create urgency without being pushy
- Offer specific next steps (dates, times, options)
- Emphasize limited availability or timing
- Make commitment as easy as possible
` : ''}

${relationshipIntent === 'personal_statuses' ? `
PERSONAL RELATIONSHIP APPROACH:
- Use warm, friendly, conversational tone
- Focus on connection and community value
- Less emphasis on business/ROI language
- Reference shared experiences or mutual connections
` : ''}

${campaignContext && (relationshipStatus === 'past_client' || relationshipType.includes('past_client')) ? `
RE-ENGAGEMENT STRATEGY (Past Client):
- Lead with positive nostalgia ("It was great working with you on...")
- DO NOT pitch basic services they already know about
- Focus on NEW opportunities, updates, or events
- Emphasize ATTENDANCE/PARTICIPATION, not business development
- Use familiar tone that acknowledges the history
` : ''}
`;
      } else if (outreachType === 'follow_up') {
        contactRelationshipContext += `
✅ FOLLOW-UP MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an ESTABLISHED RELATIONSHIP (current client, active partner, won deal).

CRITICAL RULES:
✅ DO:
- Use familiar, warm tone
- Reference specific past projects or wins together
- Focus on relationship nurture, not selling
- Offer additional value, updates, or opportunities
- Ask for feedback, referrals, or continued collaboration
- Make them feel valued and appreciated

❌ DO NOT:
- Pitch them as if they're a new prospect
- Explain basic services they already use
- Be overly formal or salesy
- Ignore the established relationship history
- Treat them as a lead who needs convincing

${relationshipType.includes('strategic_partner') || relationshipType.includes('amplifier') || relationshipStatus === 'strategic_partner' ? `
STRATEGIC PARTNER/AMPLIFIER:
- Frame opportunities around MUTUAL BENEFIT
- Appropriate to mention partnership opportunities (sponsorship, co-marketing, referral programs)
- Reference shared goals and vision
- Emphasize WIN-WIN scenarios
- OK to introduce team members for specific initiatives
` : relationshipType.includes('current_client') || relationshipStatus === 'current_client' || relationshipStatus === 'won' ? `
CURRENT/ACTIVE CLIENT:
- Focus on RELATIONSHIP DEPTH and added value
- Check in on satisfaction and needs
- Offer VIP experiences or exclusive opportunities
- Appropriate for invitations to events as GUESTS/VIPs
- Seek referrals and testimonials
- DO NOT pitch sponsorships unless they've shown interest in marketing/visibility
` : ''}

${campaignContext ? `
CAMPAIGN APPROACH FOR ESTABLISHED RELATIONSHIPS:
- Frame campaign opportunities as VIP ACCESS or EXCLUSIVE INVITATIONS
- Emphasize attendee/participant benefits, not prospect/sponsor asks
- Use language like "We'd love to have you join us" not "Learn about our services"
- Make them feel special and valued, not marketed to
` : ''}
`;
      }

      contactRelationshipContext += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  OVERRIDE HIERARCHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When there's a conflict between:
1. Campaign Goal (general objective for multiple contacts)
2. Contact Relationship Context (THIS specific contact's relationship)

ALWAYS prioritize #2 (Contact Relationship Context).

Example: Campaign says "invite past clients and partners to attend OR sponsor"
- If THIS contact = Past Client → Focus ONLY on attendance
- If THIS contact = Strategic Partner → Can mention sponsorship
- If THIS contact = Cold Lead → Focus ONLY on introduction/credibility

The campaign goal is the MENU. The relationship context tells you which items to offer THIS contact.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      console.log('[GENERATE-OUTREACH] Contact relationship context created:', contactRelationshipContext);
    }

    // Get user's business profile
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[GENERATE-OUTREACH] Error fetching business profile:', profileError);
    }

    console.log('[GENERATE-OUTREACH] Business profile:', businessProfile);

    // Fetch AI instructions from admin settings or use defaults
    console.log('[GENERATE-OUTREACH] Fetching AI instruction settings');
    let aiInstructions = {};
    
    try {
      const { data: instructionSettings, error: instructionError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .like('setting_key', 'ai_instructions_%');

      if (instructionError) {
        console.error('[GENERATE-OUTREACH] Error fetching AI instructions:', instructionError);
      } else if (instructionSettings && instructionSettings.length > 0) {
        console.log('[GENERATE-OUTREACH] Found AI instruction settings:', instructionSettings.length);
        
        // Transform settings into instruction sections
        instructionSettings.forEach((setting) => {
          const sectionId = setting.setting_key.replace('ai_instructions_', '');
          const settingValue = setting.setting_value as any;
          
          // Only include active sections
          if (settingValue?.isActive !== false && settingValue?.content) {
            (aiInstructions as Record<string, any>)[sectionId] = settingValue.content;
          }
        });
      } else {
        console.log('[GENERATE-OUTREACH] No AI instruction settings found, using defaults');
      }
    } catch (error) {
      console.error('[GENERATE-OUTREACH] Error loading AI instructions:', error);
    }

    // Build the system prompt using database instructions or defaults
    const systemPromptContent = (aiInstructions as Record<string, any>)['system_prompt'] || 
      'You are an expert cold and warm outreach copywriter specializing in mobile bar/beverage services. You write highly effective, personalized outreach messages that get responses.';
      
    const businessContextContent = (aiInstructions as Record<string, any>)['business_context'] || 
      'Mobile Bar/Event Services Company providing premium, turn-key beverage services for events, venues, and corporate clients.';
      
    const relationshipStrategyContent = (aiInstructions as Record<string, any>)['relationship_strategy'] || `
RELATIONSHIP STRATEGY MATRIX:
- Current Clients (booked_client, won status): Focus on service expansion, testimonials, referrals. Tone: appreciative, relationship-building.
- Past Clients: Reconnection, new opportunities, staying top-of-mind. Tone: warm, nostalgic.
- Warm Leads: Continue conversation, advance relationship. Tone: professional but friendly.
- Cold Prospects: Value-first approach, problem-solution fit. Tone: professional, helpful.`;

    const targetSegmentsContent = (aiInstructions as Record<string, any>)['target_segments'] || `
OUTREACH PLAYBOOK KNOWLEDGE:
You understand these key segments and their motivations:
- Venues: Want COI, licensing compliance, venue-friendly setup, no drama
- Event Planners: Need reliable partners, fast quotes, seamless execution, client wow-factor
- DMCs: Want turn-key, scalable, compliant vendors with corporate standards
- HR/People Ops: Need easy, engaging parties, predictable budgets, no liability headaches
- HOAs/Property Managers: Want resident engagement, minimal mess, budget-friendly
- Caterers: Need reliable beverage partners, smooth coordination, referral opportunities
- Photographers/Creators: Want content opportunities and mutual referrals`;

    const psychologyLeversContent = (aiInstructions as Record<string, any>)['psychology_levers'] || `
PSYCHOLOGY LEVERS:
- Risk reduction (COI, TIPS certification, compliance)
- Ease (turn-key service, simple coordination)
- Social currency (making them look good to their clients)
- Scarcity/urgency (booking deadlines, seasonal demand)
- Reciprocity (offering value upfront)`;

    const buyerProfilesContent = (aiInstructions as Record<string, any>)['buyer_profiles'] || `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FOUR BUYER PROFILES FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL INSTRUCTION: This framework guides your writing but must remain INVISIBLE to the recipient. Do not mention profiles, frameworks, or categories in the output. Simply write copy that naturally appeals to buyer psychology.

All buyers approach a purchase in one of four psychological roles. Your outreach must subtly appeal to ALL FOUR profiles in every message to maximize conversion.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. THE DREAMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE DESIRE: Transformation and new experiences
CORE FEAR: Boredom, stagnation, being stuck with status quo

POWER WORDS: Imagine, Transform, Unlock, Discover, Revolutionary, Inspired, Breathtaking, Unleash, Thrill

TACTICS:
- "Before & After" stories
- Visionary & sensory language
- Future-pacing ("How will your life change when...")
- Contrast new/exciting vs old/boring methods

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. THE LOVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE DESIRE: Belonging, connection, being understood
CORE FEAR: Being alone, excluded, misunderstood

POWER WORDS: Welcome, Join, Together, Us/We, Tribe, Community, Family, Belong, Connect, Share, Understood

TACTICS:
- Empathy-led copy ("It can be lonely trying to...")
- "Welcome home" language
- Community-focused testimonials
- Imagery of connection and collaboration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. THE SCHOLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE DESIRE: Understanding, knowledge, making the "right" decision
CORE FEAR: Making a mistake due to incomplete information

POWER WORDS: Proven, Data, Science, System, Step-by-Step, Blueprint, Guaranteed, Verified, Complete, Authoritative, Logical

TACTICS:
- "Show your work" - explain mechanisms
- Data, statistics, proof
- Comprehensive details
- Strong guarantees (remove risk)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. THE BOSS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE DESIRE: Achievement of specific, measurable goals
CORE FEAR: Failure to achieve the outcome, wasting time/money

POWER WORDS: Master, Dominate, Achieve, Elite, Results, Fast, Win, Control, Power, Ultimate, ROI, Framework

TACTICS:
- "Proven blueprint" language (system, framework)
- Hard numbers & ROI
- Focus on the specific goal/outcome
- Premium/VIP tiers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NEVER explicitly mention the profiles, framework, or categories to the recipient
2. Every piece of outreach must include elements for ALL FOUR profiles
3. Stack appeals naturally throughout the message
4. Opening hooks typically target Dreamer + Boss (pain/aspiration)
5. Middle sections target Scholar (how it works) + Lover (community/connection)
6. Closing CTAs target Boss (results) + Dreamer (transformation)
`;

    const contentFormattingContent = (aiInstructions as Record<string, any>)['content_formatting'] || `
CONTENT TYPE REQUIREMENTS:
- Email: Professional, detailed, includes full context and value proposition
- LinkedIn: Shorter, more casual, connection-focused
- Social Media: Direct message format for Instagram/Facebook DMs - conversational, personal, under 280 characters, include relevant hashtags at end
- Call Script: Conversational tone, includes talking points with "KEY POINTS:" sections for important highlights, natural phone conversation flow`;

    const writingStyleContent = (aiInstructions as Record<string, any>)['writing_style'] || `
WRITING STYLE REQUIREMENTS:
- NEVER use em dashes (--) to replace periods or other punctuation. No use of em dashes at all.
- Vary sentence structure with a mix of long and short sentences. Interrupt smooth flows occasionally, just enough to feel real, not robotic.
- Add subtle imperfections like slight redundancy, hesitations (such as "perhaps" or "I think"), to sound more natural.
- Skip slang or regionalisms. Keep language neutral but still natural. Focus on tone, pacing, and realism.
- NEVER use sentences with the pattern "It's not just about... it's about..." - avoid this construction entirely.
${touchpointContext ? `- When referencing previous touchpoints, be natural and specific. Don't just say "following up" - reference the actual interaction context.` : ''}`;

    const outputFormatContent = (aiInstructions as Record<string, any>)['output_format'] || `
RESPOND ONLY WITH VALID JSON in this exact format:
{
  "subjectLine": "compelling subject line",
  "emailBody": "full email content with proper formatting",
  "linkedinMessage": "LinkedIn connection/message version",
  "socialMediaPost": "direct message for Instagram/Facebook DMs (conversational, personal, with hashtags at end)",
  "callScript": "call script with talking points and KEY POINTS sections highlighted",
  "followUpSuggestion": "next step recommendation",
  "keyAngle": "primary positioning angle used",
  "proofPoints": ["list", "of", "suggested", "attachments"],
  "callToAction": "specific CTA used"
}`;

    // Build the comprehensive system prompt
    const systemPrompt = `${systemPromptContent}

BUSINESS CONTEXT:
${businessProfile ? `
Business Name: ${businessProfile.business_name}
Value Proposition: ${businessProfile.value_proposition || 'Premium mobile bar services'}
Industry: ${businessProfile.industry || 'Mobile Bar/Event Services'}
Target Market: ${businessProfile.target_market || 'Event planners, venues, corporate clients'}
Key Differentiators: ${businessProfile.key_differentiators || 'Professional, insured, turn-key service'}
` : businessContextContent}
${campaignContext ? `
${campaignContext}` : ''}
${contactRelationshipContext ? `
${contactRelationshipContext}` : ''}
${touchpointContext ? `
${touchpointContext}` : ''}
${researchContext ? `
${researchContext}` : ''}

${relationshipStrategyContent}

${buyerProfilesContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUYER MOTIVATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${motivationDescription}

${emphasisInstructions}

Remember: This framework guides your writing but must remain INVISIBLE to the recipient. 
Never mention profiles, psychological frameworks, or buyer categories in your output.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${targetSegmentsContent}

${psychologyLeversContent}

${contentFormattingContent}

Your job is to generate structured outreach content that:
1. Speaks directly to the segment's specific goals and pain points
2. Uses the buyer profile emphasis instructions above to guide messaging weight
3. Still includes elements for ALL FOUR profiles (but emphasize as directed)
4. Matches the requested tone and channel
5. Includes relevant proof points and offers
6. Gets responses and forwards
7. Appeals to the detected buyer motivation naturally and invisibly
${touchpointContext ? `8. References previous interactions appropriately to build continuity and relationship` : ''}
${campaignContext ? `9. CRITICAL: Incorporate the campaign/offer context naturally throughout the outreach` : ''}

${writingStyleContent}

${outputFormatContent}`;

    // Map contact category to human-readable label for the AI prompt
    const categoryMapping = {
      'corporate_planner': 'Corporate Planner',
      'wedding_planner': 'Wedding Planner', 
      'caterer': 'Caterer',
      'dj': 'DJ/Entertainment',
      'photographer': 'Photographer',
      'hr': 'HR/People Ops',
      'venue': 'Venue',
      'hoa_leasing': 'HOA/Property Manager',
      'creator': 'Content Creator',
      'other': 'Other'
    };

    const segmentLabel = categoryMapping[requestData.segment as keyof typeof categoryMapping] || requestData.segment;

    const userMessage = `Generate outreach content with these parameters:
- Outreach Type: ${requestData.outreachType}
- Target Segment: ${segmentLabel}
- Goals: ${requestData.goals}
- Tone: ${requestData.tone}
- Psychological Levers: ${requestData.psychologicalLevers?.join(', ')}
- Channel: ${requestData.channel}
- Sequence Step: ${requestData.sequenceStep}
- Length: ${requestData.length}
- Holiday Edition: ${requestData.holidayEdition ? 'Yes' : 'No'}
- Proof Assets Available: ${requestData.proofAssets?.join(', ')}
- Personalization: ${requestData.personalizationTokens}
- Offer/Incentive: ${requestData.offerIncentive || 'None specified'}
- Preferred Call to Action: ${requestData.callToAction && requestData.callToAction !== 'ai_choose' ? requestData.callToAction : 'Choose the most effective CTA for this situation'}
${requestData.contactName ? `- Contact Name: ${requestData.contactName}` : ''}
${requestData.contactRelationshipType ? `- Relationship Type: ${requestData.contactRelationshipType}` : ''}
${requestData.contactRelationshipStatus ? `- Relationship Status: ${requestData.contactRelationshipStatus}` : ''}

Generate compelling outreach content that gets responses.`;

    console.log('[GENERATE-OUTREACH] Calling OpenAI API');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GENERATE-OUTREACH] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[GENERATE-OUTREACH] OpenAI response received');
    console.log('[GENERATE-OUTREACH] Raw response data:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[GENERATE-OUTREACH] Invalid OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid AI response structure',
          debugInfo: data
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const generatedContent = data.choices[0].message.content;
    console.log('[GENERATE-OUTREACH] Generated content from AI:', generatedContent);
    
    let parsedContent;

    try {
      parsedContent = JSON.parse(generatedContent);
      console.log('[GENERATE-OUTREACH] Successfully parsed JSON content');
    } catch (parseError) {
      console.error('[GENERATE-OUTREACH] JSON parse error:', parseError);
      console.error('[GENERATE-OUTREACH] Raw content that failed to parse:', generatedContent);
      
      // Try to extract content manually if JSON parsing fails
      const fallbackContent = {
        subjectLine: "Quick question about your upcoming events",
        emailBody: generatedContent || "Generated content parsing failed",
        linkedinMessage: generatedContent || "Generated content parsing failed",
        socialMediaPost: generatedContent || "Generated content parsing failed",
        callScript: generatedContent || "Generated content parsing failed",
        followUpSuggestion: "Follow up in 3-5 business days",
        keyAngle: "Partnership opportunity",
        callToAction: "Let's schedule a quick call",
        proofPoints: ["Professional service", "Insured and licensed"]
      };
      
      console.log('[GENERATE-OUTREACH] Using fallback content structure');
      parsedContent = fallbackContent;
    }

    // Sanitize content to remove em dashes, en dashes, and double hyphens
    const sanitizeText = (text: string): string => {
      if (!text) return text;
      // Replace em dash (—), en dash (–), and double hyphen (--) with comma + space
      const sanitized = text
        .replace(/[\u2014\u2013]/g, ', ')  // em dash and en dash
        .replace(/--/g, ', ')             // double hyphen
        .replace(/,\s+,/g, ',')           // clean up double commas
        .replace(/,\s*$/, '')             // remove trailing comma
        .trim();
      
      return sanitized;
    };

    // Apply sanitization to all text fields with fallbacks
    const sanitizedContent = {
      ...parsedContent,
      subjectLine: sanitizeText(parsedContent.subjectLine),
      emailBody: sanitizeText(parsedContent.emailBody),
      linkedinMessage: sanitizeText(parsedContent.linkedinMessage),
      socialMediaPost: sanitizeText(parsedContent.socialMediaPost || parsedContent.linkedinMessage),
      callScript: sanitizeText(parsedContent.callScript || parsedContent.linkedinMessage),
      followUpSuggestion: sanitizeText(parsedContent.followUpSuggestion),
      keyAngle: sanitizeText(parsedContent.keyAngle),
      callToAction: sanitizeText(parsedContent.callToAction),
      proofPoints: parsedContent.proofPoints?.map((point: string) => sanitizeText(point)) || []
    };

    console.log('[GENERATE-OUTREACH] Generated content successfully');

    // Log AI usage and deduct tokens
    const tokensUsed = data.usage || {};
    const totalTokens = tokensUsed.total_tokens || 1000; // Default fallback
    const promptTokens = tokensUsed.prompt_tokens || 0;
    const completionTokens = tokensUsed.completion_tokens || 0;

    console.log('[GENERATE-OUTREACH] Tokens used:', { 
      prompt: promptTokens, 
      completion: completionTokens, 
      total: totalTokens 
    });

    // Log usage in background (don't block response)
    const periodStart = new Date();
    periodStart.setDate(1); // First day of current month
    
    try {
      // Log the request
      await supabase.from('ai_requests_log').insert({
        user_id: user.id,
        period_start: periodStart.toISOString().split('T')[0],
        model: 'gpt-4.1-2025-04-14',
        tokens_prompt: promptTokens,
        tokens_completion: completionTokens,
        tokens_total: totalTokens,
        success: true,
        request_ms: Date.now() - (requestData.startTime || Date.now())
      });

      // Update monthly usage - get existing and increment
      const { data: existing } = await supabase
        .from('ai_usage_monthly')
        .select('tokens_used, requests_count')
        .eq('user_id', user.id)
        .eq('period_start', periodStart.toISOString().split('T')[0])
        .single();

      await supabase.from('ai_usage_monthly').upsert({
        user_id: user.id,
        period_start: periodStart.toISOString().split('T')[0],
        tokens_used: (existing?.tokens_used || 0) + totalTokens,
        requests_count: (existing?.requests_count || 0) + 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,period_start'
      });

      // Deduct from credits first if available
      const { data: credits } = await supabase
        .from('ai_credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('tokens_remaining', 0)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: true });

      let remainingToDeduct = totalTokens;
      
      for (const credit of credits || []) {
        if (remainingToDeduct <= 0) break;
        
        const deductFromThis = Math.min(credit.tokens_remaining, remainingToDeduct);
        const newRemaining = credit.tokens_remaining - deductFromThis;
        
        await supabase
          .from('ai_credits')
          .update({
            tokens_remaining: newRemaining,
            status: newRemaining <= 0 ? 'consumed' : 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', credit.id);
        
        remainingToDeduct -= deductFromThis;
      }

      console.log('[GENERATE-OUTREACH] Usage logged successfully');
    } catch (usageError) {
      console.error('[GENERATE-OUTREACH] Error logging usage:', usageError);
      // Continue anyway - don't block the response for usage tracking failures
    }

    return new Response(JSON.stringify(sanitizedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GENERATE-OUTREACH] Error:', error);
    
    // Log failed AI request for tracking
    try {
      const periodStart = new Date();
      periodStart.setDate(1);
      
      // Try to get user from auth header if available
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      if (authHeader) {
        try {
          const { data: { user } } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
          );
          userId = user?.id;
        } catch (authError) {
          // Ignore auth errors in error handler
        }
      }
      
      if (userId) {
        await supabase.from('ai_requests_log').insert({
          user_id: userId,
          period_start: periodStart.toISOString().split('T')[0],
          model: 'gpt-4.1-2025-04-14',
          tokens_prompt: 0,
          tokens_completion: 0,
          tokens_total: 0,
          success: false,
          error_code: error instanceof Error ? error.message.substring(0, 100) : 'Unknown error' // Truncate error message
        });
      }
    } catch (logError) {
      console.error('[GENERATE-OUTREACH] Error logging failed request:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});