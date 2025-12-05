import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ICP {
  target_industries: string[];
  target_job_titles: string[];
  target_company_sizes: string[];
  geographic_scope: string;
  target_locations: string[];
  key_characteristics?: string;
}

interface Prospect {
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  linkedin_url?: string;
  location?: string;
  source_url?: string;
  match_score: number;
  match_reasons: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get search parameters from request body
    const body = await req.json().catch(() => ({}));
    const { searchLocation, searchRadius } = body;

    console.log(`[generate-prospects] Starting prospect search for user ${user.id}`, {
      customLocation: searchLocation || 'auto',
      radius: searchRadius || 'n/a'
    });

    // 1. CHECK DAILY LIMIT
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSearch } = await supabase
      .from('prospect_searches')
      .select('id')
      .eq('user_id', user.id)
      .eq('search_date', today)
      .single();

    if (existingSearch) {
      return new Response(
        JSON.stringify({ error: 'You have already run a search today. Come back tomorrow!' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. BUILD/UPDATE ICP
    console.log('[generate-prospects] Building ICP from user data...');
    
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: successfulContacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .or('status.eq.won,booking_scheduled.eq.true,revenue_amount.gt.0')
      .order('revenue_amount', { ascending: false, nullsFirst: false })
      .limit(10);

    console.log(`[generate-prospects] Found ${successfulContacts?.length || 0} successful contacts for ICP analysis`);

    const icpAnalysisPrompt = `Analyze these successful clients and business profile to create an Ideal Customer Profile:

Business Profile:
- Industry: ${businessProfile?.industry || 'Not specified'}
- Target Market: ${businessProfile?.target_market || 'Not specified'}
- Business Name: ${businessProfile?.business_name || 'Not specified'}

Successful Clients:
${successfulContacts?.map(c => `- ${c.name} (${c.company || 'No company'}) - ${c.position || 'No position'} - Location: ${c.city || c.state || 'Not specified'} - Category: ${c.category}`).join('\n')}

Return a JSON object with:
{
  "target_industries": ["industry1", "industry2"],
  "target_job_titles": ["title1", "title2"],
  "target_company_sizes": ["1-10", "11-50", etc],
  "target_locations": ["City, State"],
  "key_characteristics": "Brief summary of ideal customer"
}`;

    const icpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: icpAnalysisPrompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    const icpData = await icpResponse.json();
    const icp: ICP = JSON.parse(icpData.choices[0].message.content);
    
    console.log('[generate-prospects] ICP generated:', icp);

    // Get user's geographic scope preference
    const { data: existingIcp } = await supabase
      .from('user_icp')
      .select('geographic_scope')
      .eq('user_id', user.id)
      .single();

    const geographicScope = existingIcp?.geographic_scope || 'local';
    icp.geographic_scope = geographicScope;

    // Save/update ICP
    await supabase
      .from('user_icp')
      .upsert({
        user_id: user.id,
        ...icp,
        generated_from_contacts: successfulContacts?.map(c => c.id) || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // 3. GENERATE SEARCH QUERIES
    const searchQueries: string[] = [];
    
    // Use custom location if provided, otherwise use ICP locations
    let locationContext = '';
    const cityPart = searchLocation ? searchLocation.split(',')[0]?.trim() : '';
    const statePart = searchLocation ? searchLocation.split(',')[1]?.trim() : '';
    
    if (searchLocation) {
      locationContext = searchLocation;
      if (searchRadius === 'metro') {
        locationContext += ' metro area';
      } else if (searchRadius === 'state') {
        locationContext = statePart || searchLocation;
      }
      console.log(`[generate-prospects] Using custom location: ${locationContext}`);
    } else {
      locationContext = icp.target_locations?.[0] || businessProfile?.target_market || '';
      console.log(`[generate-prospects] Using ICP location: ${locationContext}`);
    }

    // Build location-specific search queries
    icp.target_job_titles?.slice(0, 2).forEach(title => {
      searchQueries.push(`"${title}" ${locationContext} events`);
      searchQueries.push(`"${title}" ${locationContext} linkedin`);
    });

    icp.target_industries?.slice(0, 2).forEach(industry => {
      searchQueries.push(`${industry} coordinator ${locationContext}`);
    });

    // Add location-specific search queries for better targeting
    if (searchLocation) {
      searchQueries.push(`event professionals "${searchLocation}"`);
      if (cityPart && statePart) {
        searchQueries.push(`${cityPart} ${statePart} event coordinator directory`);
      }
    }

    console.log('[generate-prospects] Search queries:', searchQueries);

    // 4. WEB SEARCH (Firecrawl)
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });
    const scrapedContent: string[] = [];

    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 searches for MVP
      try {
        console.log(`[generate-prospects] Searching for: ${query}`);
        const searchResults = await firecrawl.search(query, {
          limit: 5,
          scrapeOptions: {
            formats: ['markdown']
          }
        });

        if (searchResults.success && searchResults.data) {
          for (const result of searchResults.data) {
            if (result.markdown) {
              scrapedContent.push(`Source: ${result.url}\n\n${result.markdown.slice(0, 2000)}`);
            }
          }
        }
      } catch (error) {
        console.error(`[generate-prospects] Search failed for "${query}":`, error);
      }
    }

    console.log(`[generate-prospects] Scraped ${scrapedContent.length} pages`);

    // 5. AI EXTRACTION
    // Build strict location requirement
    let locationRequirement = '';
    if (searchLocation) {
      if (searchRadius === 'city') {
        locationRequirement = `STRICT REQUIREMENT: Only include prospects located IN or VERY NEAR ${searchLocation}. Exclude anyone from other cities or regions.`;
      } else if (searchRadius === 'metro') {
        locationRequirement = `STRICT REQUIREMENT: Only include prospects located within the ${searchLocation} metro area (approximately 50 miles radius). Exclude anyone outside this area, including other cities.`;
      } else if (searchRadius === 'state') {
        locationRequirement = `STRICT REQUIREMENT: Only include prospects located in ${statePart || searchLocation}. Exclude anyone from other states.`;
      } else {
        locationRequirement = `STRICT REQUIREMENT: Only include prospects located near ${searchLocation}. Exclude anyone from clearly different geographic areas.`;
      }
    } else {
      locationRequirement = `Preferred Locations: ${icp.target_locations?.join(', ') || 'Any'}`;
    }

    const extractionPrompt = `Extract potential prospects from this web content. Focus on finding specific people who match this Ideal Customer Profile:

${locationRequirement}

Target Industries: ${icp.target_industries?.join(', ')}
Target Job Titles: ${icp.target_job_titles?.join(', ')}
Key Characteristics: ${icp.key_characteristics}

CRITICAL: Location filtering is mandatory. If a prospect's location is not clearly within the specified geographic area above, DO NOT include them even if they match all other criteria perfectly.

Web Content:
${scrapedContent.join('\n\n---\n\n')}

Return a JSON array of prospects with this structure:
[
  {
    "name": "Full Name",
    "company": "Company Name",
    "position": "Job Title",
    "email": "email if found",
    "phone": "phone if found",
    "website_url": "company website if found",
    "linkedin_url": "linkedin profile if found",
    "location": "City, State",
    "source_url": "where you found them",
    "match_score": 85,
    "match_reasons": ["Reason 1", "Reason 2"]
  }
]

Score each prospect 0-100 based on how well they match the ICP, with location compliance being a primary factor. Include specific reasons why they match. Return up to 15 prospects.`;

    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      }),
    });

    const extractionData = await extractionResponse.json();
    let prospects: Prospect[] = [];
    
    try {
      const parsedContent = JSON.parse(extractionData.choices[0].message.content);
      prospects = parsedContent.prospects || parsedContent;
      if (!Array.isArray(prospects)) {
        prospects = [];
      }
    } catch (e) {
      console.error('[generate-prospects] Failed to parse extraction results:', e);
      prospects = [];
    }

    console.log(`[generate-prospects] Extracted ${prospects.length} prospects before location filtering`);

    // Post-process: Strict location filtering
    if (searchLocation && prospects.length > 0) {
      const locationLower = searchLocation.toLowerCase();
      const cityLower = cityPart.toLowerCase();
      const stateLower = statePart.toLowerCase();
      
      const beforeCount = prospects.length;
      prospects = prospects.filter(p => {
        if (!p.location) {
          console.log(`[generate-prospects] Filtering out prospect with no location: ${p.name}`);
          return false;
        }
        
        const prospectLocation = p.location.toLowerCase();
        
        if (searchRadius === 'city') {
          // Must match city
          const matches = prospectLocation.includes(cityLower);
          if (!matches) {
            console.log(`[generate-prospects] Filtering out ${p.name} - location "${p.location}" doesn't match city "${cityPart}"`);
          }
          return matches;
        } else if (searchRadius === 'metro') {
          // Must match city or state (50 mile radius approximation)
          const matches = prospectLocation.includes(cityLower) || 
                         (stateLower && prospectLocation.includes(stateLower));
          if (!matches) {
            console.log(`[generate-prospects] Filtering out ${p.name} - location "${p.location}" doesn't match metro area of "${searchLocation}"`);
          }
          return matches;
        } else if (searchRadius === 'state') {
          // Must match state
          const matches = stateLower && prospectLocation.includes(stateLower);
          if (!matches) {
            console.log(`[generate-prospects] Filtering out ${p.name} - location "${p.location}" doesn't match state "${statePart}"`);
          }
          return matches;
        } else {
          // National or unspecified - keep if location exists
          return true;
        }
      });
      
      console.log(`[generate-prospects] Location filtering: ${beforeCount} → ${prospects.length} prospects (removed ${beforeCount - prospects.length})`);
    }

    console.log(`[generate-prospects] Final prospect count: ${prospects.length}`);

    // 6. SAVE RESULTS
    const prospectsToSave = prospects
      .filter(p => p.name && p.match_score > 40) // Only save reasonably good matches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 15)
      .map(p => ({
        user_id: user.id,
        search_date: today,
        ...p
      }));

    if (prospectsToSave.length > 0) {
      const { error: insertError } = await supabase
        .from('prospect_suggestions')
        .insert(prospectsToSave);

      if (insertError) {
        console.error('[generate-prospects] Failed to insert prospects:', insertError);
      }
    }

    // Record search
    await supabase
      .from('prospect_searches')
      .insert({
        user_id: user.id,
        search_date: today,
        prospects_found: prospectsToSave.length,
        search_params: { 
          geographic_scope: geographicScope, 
          custom_location: searchLocation,
          search_radius: searchRadius,
          icp 
        }
      });

    // 7. LOG AI USAGE
    const totalTokens = (icpData.usage?.total_tokens || 0) + (extractionData.usage?.total_tokens || 0);
    await supabase.from('ai_requests_log').insert({
      user_id: user.id,
      period_start: today,
      tokens_total: totalTokens,
      tokens_prompt: (icpData.usage?.prompt_tokens || 0) + (extractionData.usage?.prompt_tokens || 0),
      tokens_completion: (icpData.usage?.completion_tokens || 0) + (extractionData.usage?.completion_tokens || 0),
      success: true,
      model: 'gpt-4o-mini'
    });

    console.log(`[generate-prospects] Complete! Found ${prospectsToSave.length} prospects, used ${totalTokens} tokens`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        prospects_found: prospectsToSave.length,
        icp,
        tokens_used: totalTokens
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-prospects] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});