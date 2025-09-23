import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit3, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Clock, 
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AIInstructionSection, useAIInstructions } from '@/hooks/useAIInstructions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIInstructionEditorProps {
  section: AIInstructionSection;
  onUpdate: (sectionId: string, updates: Partial<AIInstructionSection>) => void;
  isUpdating: boolean;
}

export function AIInstructionEditor({ section, onUpdate, isUpdating }: AIInstructionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(section.content);
  const [editedTitle, setEditedTitle] = useState(section.title);
  const [editedDescription, setEditedDescription] = useState(section.description);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleSave = () => {
    onUpdate(section.id, {
      content: editedContent,
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(section.content);
    setEditedTitle(section.title);
    setEditedDescription(section.description);
    setIsEditing(false);
  };

  const toggleActive = () => {
    onUpdate(section.id, { isActive: !section.isActive });
  };

  return (
    <Card className={`transition-all ${!section.isActive ? 'opacity-60 border-muted' : 'border-primary/20'}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-semibold text-lg"
                  placeholder="Section title..."
                />
                <Input
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="text-sm text-muted-foreground"
                  placeholder="Section description..."
                />
              </div>
            ) : (
              <div>
                <CardTitle className="flex items-center gap-2">
                  {section.title}
                  {section.isActive ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={section.isActive}
              onCheckedChange={toggleActive}
              disabled={isUpdating}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isUpdating}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            v{section.version} • {new Date(section.lastUpdated).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {section.updatedBy}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!section.isActive && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This section is inactive and will not be included in AI generation.
            </AlertDescription>
          </Alert>
        )}

        {isPreviewMode ? (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Preview:</div>
            <div className="whitespace-pre-wrap text-sm font-mono">
              {isEditing ? editedContent : section.content}
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-2">
            <Label htmlFor={`content-${section.id}`}>Content</Label>
            <Textarea
              id={`content-${section.id}`}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter instruction content..."
            />
            <div className="text-xs text-muted-foreground">
              {editedContent.length} characters
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="whitespace-pre-wrap text-sm">
              {section.content.length > 200 
                ? `${section.content.substring(0, 200)}...` 
                : section.content
              }
            </div>
            {section.content.length > 200 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs mt-2"
                onClick={() => setIsPreviewMode(true)}
              >
                View full content
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AIInstructionsManager() {
  const { instructions, isLoading, error, updateInstruction, isUpdating, resetToDefaults, isResetting } = useAIInstructions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load AI instructions. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const instructionSections = instructions ? Object.values(instructions) : [];
  const activeSections = instructionSections.filter(s => s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Generation Instructions</h3>
          <p className="text-sm text-muted-foreground">
            Configure how the AI generates outreach content. {activeSections} of {instructionSections.length} sections active.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => resetToDefaults()}
            disabled={isResetting || isUpdating}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6">
        {instructionSections.map((section) => (
          <AIInstructionEditor
            key={section.id}
            section={section}
            onUpdate={updateInstruction}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      {instructionSections.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No instructions found</h3>
            <p className="text-muted-foreground text-center mb-4">
              No AI instruction sections are configured. Click "Reset to Defaults" to load the standard instruction set.
            </p>
            <Button onClick={() => resetToDefaults()} disabled={isResetting}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Load Default Instructions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}