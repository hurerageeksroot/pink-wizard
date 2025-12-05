import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, UserPlus, X, ExternalLink, MapPin, Building2, Briefcase } from 'lucide-react';
import type { Prospect } from '@/hooks/useProspecting';

interface ProspectCardProps {
  prospect: Prospect;
  onSave: () => void;
  onAddToContacts: () => void;
  onDismiss: () => void;
}

export function ProspectCard({ prospect, onSave, onAddToContacts, onDismiss }: ProspectCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
  };

  const getScoreIndicator = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '⚪';
  };

  const isDismissed = prospect.status === 'dismissed';
  const isAdded = prospect.status === 'added_to_contacts';

  return (
    <Card className={isDismissed ? 'opacity-50' : ''}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with score and name */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getScoreIndicator(prospect.match_score)}</span>
                <Badge className={getScoreColor(prospect.match_score)}>
                  {prospect.match_score}% Match
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{prospect.name}</h3>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {prospect.position && prospect.company && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.position} @ {prospect.company}</span>
              </div>
            )}

            {prospect.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{prospect.location}</span>
              </div>
            )}

            {prospect.company && !prospect.position && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{prospect.company}</span>
              </div>
            )}

            {prospect.linkedin_url && (
              <a
                href={prospect.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn Profile
              </a>
            )}
          </div>

          {/* Match Reasons */}
          {prospect.match_reasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Why this is a good match:</p>
              <div className="flex flex-wrap gap-2">
                {prospect.match_reasons.map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    ✨ {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isAdded && !isDismissed && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={prospect.status === 'saved'}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {prospect.status === 'saved' ? 'Saved' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  onClick={onAddToContacts}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add to Contacts
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {isAdded && (
              <Badge variant="secondary" className="px-3 py-1">
                ✓ Added to Contacts
              </Badge>
            )}

            {isDismissed && (
              <Badge variant="secondary" className="px-3 py-1">
                Dismissed
              </Badge>
            )}

            {prospect.source_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="ml-auto"
              >
                <a href={prospect.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Source
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}