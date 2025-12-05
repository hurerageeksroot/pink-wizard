import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useContactContexts } from "@/hooks/useContactContexts";
import { ContactContextData } from "@/types/crm";

interface ContactContextTagsProps {
  contactId: string;
  preloadedContexts?: ContactContextData[];
  className?: string;
  onChange?: (contexts: ContactContextData[]) => void;
  disabled?: boolean;
  maxDisplay?: number;
}

export function ContactContextTags({ 
  contactId, 
  preloadedContexts,
  className = "", 
  onChange, 
  disabled = false,
  maxDisplay = 3 
}: ContactContextTagsProps) {
  const { contexts, getContactContexts, assignContextToContact, removeContextFromContact, addContext } = useContactContexts();
  const [contactContexts, setContactContexts] = useState<ContactContextData[]>(preloadedContexts || []);
  const [loading, setLoading] = useState(!preloadedContexts);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    // Only fetch if contexts weren't preloaded
    if (!preloadedContexts) {
      loadContactContexts();
    }
  }, [contactId, preloadedContexts]);

  const loadContactContexts = async () => {
    if (!contactId) return;
    
    setLoading(true);
    try {
      const contextList = await getContactContexts(contactId);
      setContactContexts(contextList);
    } catch (error) {
      console.error('Error loading contact contexts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContext = async (contextId: string) => {
    if (disabled) return;

    const success = await assignContextToContact(contactId, contextId);
    if (success) {
      const newContext = contexts.find(c => c.id === contextId);
      if (newContext && !contactContexts.find(c => c.id === contextId)) {
        const updatedContexts = [...contactContexts, newContext];
        setContactContexts(updatedContexts);
        onChange?.(updatedContexts);
      }
    }
  };

  const handleRemoveContext = async (contextId: string) => {
    if (disabled) return;

    const success = await removeContextFromContact(contactId, contextId);
    if (success) {
      const updatedContexts = contactContexts.filter(c => c.id !== contextId);
      setContactContexts(updatedContexts);
      onChange?.(updatedContexts);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!newTagName.trim() || disabled) return;
    
    try {
      const newContext = await addContext({
        name: newTagName.toLowerCase().replace(/\s+/g, '_'),
        label: newTagName,
        iconName: 'Tag',
        colorClass: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
      });
      
      if (newContext?.id) {
        await handleAddContext(newContext.id);
      }
      
      setNewTagName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating and assigning tag:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center space-x-1">
      <div className="w-16 h-5 bg-muted animate-pulse rounded"></div>
      <div className="w-20 h-5 bg-muted animate-pulse rounded"></div>
    </div>;
  }

  const displayContexts = contactContexts.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, contactContexts.length - maxDisplay);

  const availableContexts = contexts.filter(c => 
    !contactContexts.find(cc => cc.id === c.id)
  );

  return (
    <div className={`flex items-center flex-wrap gap-1 ${className}`}>
      {displayContexts.map((context) => {
        const IconComponent = (LucideIcons as any)[context.iconName] || Tag;
        
        return (
          <TooltipProvider key={context.id}>
            <Tooltip>
              <TooltipTrigger>
                <Badge className={`${context.colorClass} ${!disabled ? 'group cursor-pointer' : ''}`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {context.label}
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveContext(context.id);
                      }}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{context.label}</div>
                  {!disabled && (
                    <div className="text-xs mt-1">Click X to remove</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {hiddenCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{hiddenCount} more
        </Badge>
      )}

      {!disabled && availableContexts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2">
              <Plus className="w-3 h-3 mr-1" />
              Add Context
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Available Contexts
            </div>
            <DropdownMenuSeparator />
            {availableContexts.map((context) => {
              const IconComponent = (LucideIcons as any)[context.iconName] || Tag;
              return (
                <DropdownMenuItem
                  key={context.id}
                  onClick={() => handleAddContext(context.id)}
                  className="flex items-center space-x-2"
                >
                  <Badge className={`${context.colorClass} pointer-events-none`}>
                    <IconComponent className="w-3 h-3 mr-1" />
                    {context.label}
                  </Badge>
                </DropdownMenuItem>
              );
            })}
            {availableContexts.length === 0 && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">No contexts available</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 text-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Tag</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!disabled && contactContexts.length === 0 && availableContexts.length === 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>No tags available.</span>
          <a href="/settings?tab=tags" className="text-primary hover:underline">
            Create tags in Settings
          </a>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Context Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tagName">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., VIP Client, Wedding Season"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateAndAssign();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setNewTagName('');
                setShowCreateDialog(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateAndAssign} disabled={!newTagName.trim()}>
                Create & Add Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}