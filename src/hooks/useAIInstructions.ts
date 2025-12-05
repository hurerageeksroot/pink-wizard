import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AIInstructionSection {
  id: string;
  title: string;
  description: string;
  content: string;
  isActive: boolean;
  version: number;
  lastUpdated: string;
  updatedBy: string;
}

export const useAIInstructions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI instruction settings from admin_settings table
  const { data: instructions, isLoading, error } = useQuery({
    queryKey: ['ai-instructions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('setting_key', 'ai_instructions_%')
        .order('setting_key');

      if (error) throw error;

      // Transform the data into structured sections
      const sections: Record<string, AIInstructionSection> = {};
      
      data?.forEach((setting) => {
        const sectionId = setting.setting_key.replace('ai_instructions_', '');
        const settingValue = setting.setting_value as any; // Type assertion for Json
        sections[sectionId] = {
          id: sectionId,
          title: settingValue?.title || sectionId,
          description: settingValue?.description || '',
          content: settingValue?.content || '',
          isActive: settingValue?.isActive !== false,
          version: settingValue?.version || 1,
          lastUpdated: setting.updated_at,
          updatedBy: setting.updated_by || 'System'
        };
      });

      // Return default sections if none exist
      if (Object.keys(sections).length === 0) {
        return getDefaultInstructions();
      }

      return sections;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update instruction section
  const updateInstructionMutation = useMutation({
    mutationFn: async ({ sectionId, updates }: { sectionId: string; updates: Partial<AIInstructionSection> }) => {
      const currentSection = instructions?.[sectionId];
      const newVersion = (currentSection?.version || 0) + 1;
      
      const settingValue = {
        title: updates.title || currentSection?.title,
        description: updates.description || currentSection?.description,
        content: updates.content || currentSection?.content,
        isActive: updates.isActive !== undefined ? updates.isActive : (currentSection?.isActive !== false),
        version: newVersion,
        previousVersions: [
          ...(currentSection?.version ? [{ version: currentSection.version, content: currentSection.content, timestamp: new Date().toISOString() }] : [])
        ]
      };

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: `ai_instructions_${sectionId}`,
          setting_value: settingValue,
          description: `AI instruction section: ${updates.title || sectionId}`,
          updated_by: user?.id
        });

      if (error) throw error;
      return { sectionId, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-instructions'] });
      toast({
        title: "Instructions Updated",
        description: "AI instruction section has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating AI instructions:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update AI instructions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset to defaults
  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const defaults = getDefaultInstructions();
      
      const promises = Object.entries(defaults).map(([sectionId, section]) =>
        supabase
          .from('admin_settings')
          .upsert({
            setting_key: `ai_instructions_${sectionId}`,
            setting_value: {
              title: section.title,
              description: section.description,
              content: section.content,
              isActive: section.isActive,
              version: 1,
            },
            description: `AI instruction section: ${section.title}`,
            updated_by: user?.id
          })
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to reset ${errors.length} sections`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-instructions'] });
      toast({
        title: "Reset Complete",
        description: "All AI instructions have been reset to defaults.",
      });
    },
    onError: (error) => {
      console.error('Error resetting AI instructions:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset AI instructions. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    instructions,
    isLoading,
    error,
    updateInstruction: (sectionId: string, updates: Partial<AIInstructionSection>) =>
      updateInstructionMutation.mutate({ sectionId, updates }),
    isUpdating: updateInstructionMutation.isPending,
    resetToDefaults: () => resetToDefaultsMutation.mutate(),
    isResetting: resetToDefaultsMutation.isPending,
  };
};

// Default AI instruction sections
function getDefaultInstructions(): Record<string, AIInstructionSection> {
  return {
    system_prompt: {
      id: 'system_prompt',
      title: 'System Prompt & Role Definition',
      description: 'Core AI role and personality definition',
      content: `You are an expert cold and warm outreach copywriter specializing in mobile bar/beverage services. You write highly effective, personalized outreach messages that get responses.`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    business_context: {
      id: 'business_context',
      title: 'Business Context & Value Propositions',
      description: 'Information about the business and its value propositions',
      content: `BUSINESS CONTEXT:
Mobile Bar/Event Services Company providing premium, turn-key beverage services for events, venues, and corporate clients.

Core Value Propositions:
- Professional, insured, fully licensed service
- Turn-key setup with no venue hassle
- Customizable packages for any event size
- Experienced bartenders and premium equipment
- Full liability coverage and compliance`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    relationship_strategy: {
      id: 'relationship_strategy',
      title: 'Relationship Strategy Matrix',
      description: 'How to approach different types of relationships',
      content: `RELATIONSHIP STRATEGY MATRIX:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT/ACTIVE CLIENTS (booked_client, won status)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Focus on: Service expansion, testimonials, referrals
- Tone: Appreciative, relationship-building
- Opening strategy: Thank them, reference recent work, add value

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAST CLIENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Focus on: Reconnection, new opportunities, staying top-of-mind
- Tone: Warm, nostalgic
- Opening strategy: Reference past event/project, share updates, offer new value

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARM CONTACTS - CRITICAL NUANCE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: "Warm" has TWO distinct types - detect which applies:

**TYPE 1: CONVERSATION-BASED WARM**
When: TOUCHPOINT HISTORY section shows recent calls, meetings, or direct conversations
Opening strategies:
- "Following up on our conversation about..."
- "Building on what we discussed..."
- "I've been thinking about [specific thing they mentioned]..."
- Reference specific details from previous interactions

**TYPE 2: ECOSYSTEM-BASED WARM (PASSIVE)**
When: NO recent touchpoint history OR touchpoints are passive (email opens, social engagement, past purchases, referrals)
Opening strategies:
- "I noticed [recent behavior/purchase/engagement]..."
- "As someone who [has worked with us/follows our content/is in our network]..."
- "Given your interest in [topic/service]..."
- "You've been on my mind because [relevant business context]..."
- "I saw [their recent post/achievement/announcement]..."
- Reference their position/expertise, NOT a conversation that didn't happen

❌ NEVER for Ecosystem-Based Warm:
- "I've been thinking about our conversation..." (there was no conversation!)
- "Following up on what we discussed..." (we didn't discuss anything!)
- "As we talked about..." (we didn't talk!)
- Any reference to interactions that don't exist in the touchpoint history

✅ DO for Ecosystem-Based Warm:
- Acknowledge the existing relationship naturally ("You've been part of our community...")
- Reference observable behaviors ("I saw you booked with us last year...")
- Use shared context ("As a fellow [industry] professional...")
- Lead with value and relevance, not fabricated conversations
- If they purchased before, reference the value they experienced
- If they follow your content, reference shared interests/topics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLD PROSPECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Focus on: Value-first approach, problem-solution fit
- Tone: Professional, helpful
- Opening strategy: Establish credibility, identify with their pain point, offer value`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    target_segments: {
      id: 'target_segments',
      title: 'Target Segments & Motivations',
      description: 'Understanding of key customer segments and their needs',
      content: `OUTREACH PLAYBOOK KNOWLEDGE:
You understand these key segments and their motivations:
- Venues: Want COI, licensing compliance, venue-friendly setup, no drama
- Event Planners: Need reliable partners, fast quotes, seamless execution, client wow-factor
- DMCs: Want turn-key, scalable, compliant vendors with corporate standards
- HR/People Ops: Need easy, engaging parties, predictable budgets, no liability headaches
- HOAs/Property Managers: Want resident engagement, minimal mess, budget-friendly
- Caterers: Need reliable beverage partners, smooth coordination, referral opportunities
- Photographers/Creators: Want content opportunities and mutual referrals`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    psychology_levers: {
      id: 'psychology_levers',
      title: 'Psychology Levers & Persuasion Techniques',
      description: 'Key psychological triggers to use in outreach',
      content: `PSYCHOLOGY LEVERS:
- Risk reduction (COI, TIPS certification, compliance)
- Ease (turn-key service, simple coordination)
- Social currency (making them look good to their clients)
- Scarcity/urgency (booking deadlines, seasonal demand)
- Reciprocity (offering value upfront)
- Authority (certifications, testimonials, experience)
- Social proof (client success stories, venue partnerships)`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    content_formatting: {
      id: 'content_formatting',
      title: 'Content Types & Formatting Rules',
      description: 'Requirements for different content types and formats',
      content: `CONTENT TYPE REQUIREMENTS:
- Email: Professional, detailed, includes full context and value proposition
- LinkedIn: Shorter, more casual, connection-focused
- Social Media: Direct message format for Instagram/Facebook DMs - conversational, personal, under 280 characters, include relevant hashtags at end
- Call Script: Conversational tone, includes talking points with "KEY POINTS:" sections for important highlights, natural phone conversation flow`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    writing_style: {
      id: 'writing_style',
      title: 'Writing Style Requirements',
      description: 'Specific style and tone requirements for generated content',
      content: `WRITING STYLE REQUIREMENTS:
- NEVER use em dashes (--) to replace periods or other punctuation. No use of em dashes at all.
- Vary sentence structure with a mix of long and short sentences. Interrupt smooth flows occasionally, just enough to feel real, not robotic.
- Add subtle imperfections like slight redundancy, hesitations (such as "perhaps" or "I think"), to sound more natural.
- Skip slang or regionalisms. Keep language neutral but still natural. Focus on tone, pacing, and realism.
- NEVER use sentences with the pattern "It's not just about... it's about..." - avoid this construction entirely.
- When referencing previous touchpoints, be natural and specific. Don't just say "following up" - reference the actual interaction context.`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    },
    output_format: {
      id: 'output_format',
      title: 'Output Format Specifications',
      description: 'Required JSON output format and structure',
      content: `RESPOND ONLY WITH VALID JSON in this exact format:
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
}`,
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System'
    }
  };
}