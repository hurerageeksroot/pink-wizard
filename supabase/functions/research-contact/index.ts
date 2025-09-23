import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('User authenticated:', user.id);

    // Check AI quota
    const { data: quotaData, error: quotaError } = await supabaseClient.rpc('get_my_ai_quota');
    if (quotaError) {
      console.error('Error checking AI quota:', quotaError);
      throw new Error('Failed to check AI quota');
    }

    if (!quotaData || quotaData.length === 0) {
      throw new Error('No AI quota data found');
    }

    const quota = quotaData[0];
    const estimatedTokens = 2000; // Estimate for research task

    if (quota.remaining < estimatedTokens) {
      throw new Error('Insufficient AI quota remaining');
    }

    console.log('AI quota check passed:', quota);

    const { contactId } = await req.json();
    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (contactError || !contact) {
      throw new Error('Contact not found or unauthorized');
    }

    console.log('Contact found:', contact.name);

    // Check if research already exists
    const { data: existingResearch } = await supabaseClient
      .from('contact_research')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingResearch) {
      return new Response(JSON.stringify(existingResearch), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize research record
    const { data: research, error: insertError } = await supabaseClient
      .from('contact_research')
      .insert({
        user_id: user.id,
        contact_id: contactId,
        status: 'processing',
        research_data: {}
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error creating research record:', insertError);
      throw new Error('Failed to create research record');
    }

    // Start research process
    let researchData = {
      bio: '',
      keyFacts: [],
      icebreakers: [],
      outreachAngles: [],
      sources: []
    };

    try {
      // Try web research if we have URLs
      const urlsToResearch = [
        contact.website_url,
        contact.linkedin_url,
        contact.company ? `https://www.google.com/search?q="${contact.company}"` : null
      ].filter(Boolean);

      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      
      if (firecrawlApiKey && urlsToResearch.length > 0) {
        console.log('Starting Firecrawl research for URLs:', urlsToResearch);
        
        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        
        for (const url of urlsToResearch.slice(0, 2)) { // Limit to 2 URLs
          try {
            const crawlResult = await firecrawl.scrapeUrl(url, {
              formats: ['markdown'],
              timeout: 10000
            });
            
            if (crawlResult.success && crawlResult.data?.markdown) {
              researchData.sources.push({
                url,
                content: crawlResult.data.markdown.substring(0, 2000), // Limit content
                timestamp: new Date().toISOString()
              });
              console.log('Successfully crawled:', url);
            }
          } catch (crawlError) {
            console.error('Error crawling URL:', url, crawlError);
          }
        }
      }

      // Generate research insights using OpenAI
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiApiKey) {
        const contactInfo = `
Name: ${contact.name}
Company: ${contact.company || 'N/A'}
Position: ${contact.position || 'N/A'}
Email: ${contact.email}
Phone: ${contact.phone || 'N/A'}
LinkedIn: ${contact.linkedin_url || 'N/A'}
Website: ${contact.website_url || 'N/A'}
Notes: ${contact.notes || 'N/A'}
Category: ${contact.category}
Status: ${contact.status}
Relationship: ${contact.relationship_type}
`;

        const webContent = researchData.sources.map(s => s.content).join('\n\n').substring(0, 3000);
        
        const prompt = `Based on the following contact information and any available web research, provide professional networking insights:

CONTACT INFO:
${contactInfo}

WEB RESEARCH:
${webContent || 'No web research available'}

Please provide a structured response with:
1. Professional bio/background (2-3 sentences)
2. Key facts (3-5 bullet points)
3. Conversation icebreakers (3-4 suggestions)
4. Outreach angles (3-4 professional approaches)

Focus on professional, warm networking approaches. Be specific and actionable.`;

        console.log('Generating AI insights...');

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a professional networking research assistant. Provide structured, actionable insights for warm business outreach.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }),
        });

        const aiResult = await openaiResponse.json();
        
        if (aiResult.choices && aiResult.choices[0]) {
          const insights = aiResult.choices[0].message.content;
          
          // Parse the structured response (simplified)
          const lines = insights.split('\n').filter(line => line.trim());
          let currentSection = '';
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().includes('bio') || trimmed.toLowerCase().includes('background')) {
              currentSection = 'bio';
            } else if (trimmed.toLowerCase().includes('key facts')) {
              currentSection = 'keyFacts';
            } else if (trimmed.toLowerCase().includes('icebreaker')) {
              currentSection = 'icebreakers';
            } else if (trimmed.toLowerCase().includes('outreach')) {
              currentSection = 'outreachAngles';
            } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
              const cleanText = trimmed.replace(/^[-•\d\.\s]+/, '').trim();
              if (cleanText && currentSection && currentSection !== 'bio') {
                researchData[currentSection].push(cleanText);
              }
            } else if (currentSection === 'bio' && trimmed && !trimmed.includes(':')) {
              researchData.bio += (researchData.bio ? ' ' : '') + trimmed;
            }
          }
          
          console.log('AI insights generated successfully');
          
          // Log AI usage
          await supabaseClient.from('ai_requests_log').insert({
            user_id: user.id,
            period_start: new Date().toISOString().split('T')[0],
            tokens_total: aiResult.usage?.total_tokens || estimatedTokens,
            tokens_prompt: aiResult.usage?.prompt_tokens || Math.floor(estimatedTokens * 0.7),
            tokens_completion: aiResult.usage?.completion_tokens || Math.floor(estimatedTokens * 0.3),
            success: true,
            model: 'gpt-4o-mini'
          });
        }
      }

      // Fallback research if no AI insights
      if (!researchData.bio && !researchData.keyFacts.length) {
        researchData = {
          bio: `${contact.name} ${contact.position ? `works as ${contact.position}` : 'is a professional'} ${contact.company ? `at ${contact.company}` : 'in their field'}.`,
          keyFacts: [
            contact.company ? `Works at ${contact.company}` : 'Company information not available',
            contact.position ? `Position: ${contact.position}` : 'Position not specified',
            contact.category ? `Category: ${contact.category}` : 'General contact',
            contact.relationship_type ? `Relationship: ${contact.relationship_type}` : 'Professional relationship'
          ].filter(Boolean),
          icebreakers: [
            'Hope you\'re doing well!',
            'I came across your profile and was impressed by your work.',
            'I\'d love to catch up and hear about what you\'re working on.',
            'Thought you might be interested in this opportunity.'
          ],
          outreachAngles: [
            'Mutual connection introduction',
            'Industry insights sharing',
            'Collaboration opportunity',
            'Professional development discussion'
          ],
          sources: researchData.sources
        };
      }

      // Update research record with results
      const { error: updateError } = await supabaseClient
        .from('contact_research')
        .update({
          research_data: researchData,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', research.id);

      if (updateError) {
        console.error('Error updating research:', updateError);
        throw new Error('Failed to save research results');
      }

      console.log('Research completed successfully for contact:', contact.name);

      return new Response(JSON.stringify({
        ...research,
        research_data: researchData,
        status: 'completed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (researchError) {
      console.error('Research process error:', researchError);
      
      // Update with error status
      await supabaseClient
        .from('contact_research')
        .update({
          status: 'error',
          error_message: researchError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', research.id);

      throw researchError;
    }

  } catch (error) {
    console.error('Error in research-contact function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});