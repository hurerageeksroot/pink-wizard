import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { ICP } from '@/hooks/useProspecting';

interface ICPCardProps {
  icp: ICP | null;
  loading: boolean;
}

export function ICPCard({ icp, loading }: ICPCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Ideal Customer Profile</CardTitle>
          <CardDescription>Building your ICP from successful clients...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!icp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Ideal Customer Profile</CardTitle>
          <CardDescription>
            We'll analyze your successful clients to build your ICP when you run your first search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your ICP helps us find prospects that match your best clients
          </p>
        </CardContent>
      </Card>
    );
  }

  const scopeLabels = {
    local: 'Local (50 miles)',
    regional: 'Regional',
    national: 'National',
    international: 'International'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Your Ideal Customer Profile</CardTitle>
            <CardDescription>
              Based on {icp.generated_from_contacts.length} successful clients
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {icp.target_industries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Target Industries</h4>
            <div className="flex flex-wrap gap-2">
              {icp.target_industries.map((industry) => (
                <Badge key={industry} variant="secondary">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {icp.target_job_titles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Target Job Titles</h4>
            <div className="flex flex-wrap gap-2">
              {icp.target_job_titles.map((title) => (
                <Badge key={title} variant="outline">
                  {title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {icp.target_locations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Target Locations</h4>
            <div className="flex flex-wrap gap-2">
              {icp.target_locations.map((location) => (
                <Badge key={location} variant="outline">
                  {location}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Focus: {scopeLabels[icp.geographic_scope]}
            </p>
          </div>
        )}

        {icp.key_characteristics && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Characteristics</h4>
            <p className="text-sm text-muted-foreground">
              {icp.key_characteristics}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}