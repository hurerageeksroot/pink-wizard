import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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


    const requestData = await req.json();
    console.log('[GENERATE-OUTREACH] Request data:', requestData);

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
            aiInstructions[sectionId] = settingValue.content;
          }
        });
      } else {
        console.log('[GENERATE-OUTREACH] No AI instruction settings found, using defaults');
      }
    } catch (error) {
      console.error('[GENERATE-OUTREACH] Error loading AI instructions:', error);
    }

    // Build the system prompt using database instructions or defaults
    const systemPromptContent = aiInstructions['system_prompt'] || 
      'You are an expert cold and warm outreach copywriter specializing in mobile bar/beverage services. You write highly effective, personalized outreach messages that get responses.';
      
    const businessContextContent = aiInstructions['business_context'] || 
      'Mobile Bar/Event Services Company providing premium, turn-key beverage services for events, venues, and corporate clients.';
      
    const relationshipStrategyContent = aiInstructions['relationship_strategy'] || `
RELATIONSHIP STRATEGY MATRIX:
- Current Clients (booked_client, won status): Focus on service expansion, testimonials, referrals. Tone: appreciative, relationship-building.
- Past Clients: Reconnection, new opportunities, staying top-of-mind. Tone: warm, nostalgic.
- Warm Leads: Continue conversation, advance relationship. Tone: professional but friendly.
- Cold Prospects: Value-first approach, problem-solution fit. Tone: professional, helpful.`;

    const targetSegmentsContent = aiInstructions['target_segments'] || `
OUTREACH PLAYBOOK KNOWLEDGE:
You understand these key segments and their motivations:
- Venues: Want COI, licensing compliance, venue-friendly setup, no drama
- Event Planners: Need reliable partners, fast quotes, seamless execution, client wow-factor
- DMCs: Want turn-key, scalable, compliant vendors with corporate standards
- HR/People Ops: Need easy, engaging parties, predictable budgets, no liability headaches
- HOAs/Property Managers: Want resident engagement, minimal mess, budget-friendly
- Caterers: Need reliable beverage partners, smooth coordination, referral opportunities
- Photographers/Creators: Want content opportunities and mutual referrals`;

    const psychologyLeversContent = aiInstructions['psychology_levers'] || `
PSYCHOLOGY LEVERS:
- Risk reduction (COI, TIPS certification, compliance)
- Ease (turn-key service, simple coordination)
- Social currency (making them look good to their clients)
- Scarcity/urgency (booking deadlines, seasonal demand)
- Reciprocity (offering value upfront)`;

    const contentFormattingContent = aiInstructions['content_formatting'] || `
CONTENT TYPE REQUIREMENTS:
- Email: Professional, detailed, includes full context and value proposition
- LinkedIn: Shorter, more casual, connection-focused
- Social Media: Direct message format for Instagram/Facebook DMs - conversational, personal, under 280 characters, include relevant hashtags at end
- Call Script: Conversational tone, includes talking points with "KEY POINTS:" sections for important highlights, natural phone conversation flow`;

    const writingStyleContent = aiInstructions['writing_style'] || `
WRITING STYLE REQUIREMENTS:
- NEVER use em dashes (--) to replace periods or other punctuation. No use of em dashes at all.
- Vary sentence structure with a mix of long and short sentences. Interrupt smooth flows occasionally, just enough to feel real, not robotic.
- Add subtle imperfections like slight redundancy, hesitations (such as "perhaps" or "I think"), to sound more natural.
- Skip slang or regionalisms. Keep language neutral but still natural. Focus on tone, pacing, and realism.
- NEVER use sentences with the pattern "It's not just about... it's about..." - avoid this construction entirely.
${touchpointContext ? `- When referencing previous touchpoints, be natural and specific. Don't just say "following up" - reference the actual interaction context.` : ''}`;

    const outputFormatContent = aiInstructions['output_format'] || `
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
${touchpointContext ? `
${touchpointContext}` : ''}
${researchContext ? `
${researchContext}` : ''}

${relationshipStrategyContent}

${targetSegmentsContent}

${psychologyLeversContent}

${contentFormattingContent}

Your job is to generate structured outreach content that:
1. Speaks directly to the segment's specific goals and pain points
2. Uses appropriate psychological levers
3. Matches the requested tone and channel
4. Includes relevant proof points and offers
5. Gets responses and forwards
${touchpointContext ? `6. References previous interactions appropriately to build continuity and relationship` : ''}

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
    const totalTokens = tokensUsed.total_tokens || estimatedTokens;
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
          error_code: error.message.substring(0, 100) // Truncate error message
        });
      }
    } catch (logError) {
      console.error('[GENERATE-OUTREACH] Error logging failed request:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});