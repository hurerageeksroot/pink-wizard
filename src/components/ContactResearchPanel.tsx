import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useContactResearchWithQuota } from '@/hooks/useContactResearchWithQuota';
import { Search, ExternalLink, Lightbulb, MessageSquare, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactResearchPanelProps {
  contactId: string;
  contactName: string;
}

export const ContactResearchPanel = ({ contactId, contactName }: ContactResearchPanelProps) => {
  const { 
    research, 
    isLoading, 
    startResearch, 
    isStartingResearch, 
    canAffordResearch,
    quotaInfo 
  } = useContactResearchWithQuota(contactId);

  const handleStartResearch = async () => {
    try {
      await startResearch();
      toast.success('Research completed successfully!');
    } catch (error: any) {
      console.error('Research error:', error);
      if (error.message?.includes('quota')) {
        toast.error('Not enough AI tokens remaining. Please purchase more tokens.');
      } else if (error.message?.includes('not found')) {
        toast.error('Contact not found or access denied.');
      } else {
        toast.error(error.message || 'Research failed. Please try again.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Contact Research
          </CardTitle>
          <CardDescription>Loading research data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!research) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Contact Research
          </CardTitle>
          <CardDescription>
            Get AI-powered insights about {contactName} to improve your outreach effectiveness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canAffordResearch && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700 font-medium">Insufficient AI Quota</p>
              <p className="text-xs text-amber-600 mt-1">
                Research requires ~2,000 tokens. You have {quotaInfo?.remaining || 0} remaining.
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleStartResearch} 
            disabled={isStartingResearch || !canAffordResearch}
            className="w-full"
          >
            {isStartingResearch ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Start Research
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const researchData = research.research_data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Contact Research
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(research.status)}
            <Badge variant={research.status === 'completed' ? 'default' : 'secondary'}>
              {research.status}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          AI-powered insights for {contactName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {research.status === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{research.error_message}</p>
            <Button 
              onClick={handleStartResearch} 
              disabled={isStartingResearch}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry Research
            </Button>
          </div>
        )}

        {research.status === 'processing' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-600 flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Research in progress... This may take a few moments.
            </p>
          </div>
        )}

        {research.status === 'completed' && researchData && (
          <>
            {/* Bio Section */}
            {researchData.bio && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Professional Background
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{researchData.bio}</p>
              </div>
            )}

            <Separator />

            {/* Key Facts */}
            {researchData.keyFacts && researchData.keyFacts.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Facts
                </h4>
                <ul className="space-y-2">
                  {researchData.keyFacts.map((fact: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Icebreakers */}
            {researchData.icebreakers && researchData.icebreakers.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation Starters
                </h4>
                <div className="space-y-2">
                  {researchData.icebreakers.map((icebreaker: string, index: number) => (
                    <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      "{icebreaker}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Outreach Angles */}
            {researchData.outreachAngles && researchData.outreachAngles.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Outreach Approaches
                </h4>
                <div className="grid gap-2">
                  {researchData.outreachAngles.map((angle: string, index: number) => (
                    <Badge key={index} variant="outline" className="justify-start p-2 h-auto">
                      {angle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {researchData.sources && researchData.sources.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Research Sources
                  </h4>
                  <div className="space-y-2">
                    {researchData.sources.map((source: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {source.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Research completed</span>
              <Button 
                onClick={handleStartResearch} 
                disabled={isStartingResearch}
                variant="outline"
                size="sm"
              >
                <Search className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};