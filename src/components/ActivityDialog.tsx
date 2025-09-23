
import { useState, useEffect } from "react";
import { Contact, TouchpointType, Activity, ActivityType } from "@/types/crm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Mail, Phone, MessageCircle, Calendar as CalendarLucide, Share2, Linkedin, MailIcon, DollarSign, UserCheck, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (payload: {
    type: TouchpointType;
    title: string;
    description?: string;
    responseReceived: boolean;
    when: Date;
    nextFollowUp?: Date;
  }) => void;
  editingActivity?: Activity;
}

export function ActivityDialog({ open, onOpenChange, contact, onSave, editingActivity }: ActivityDialogProps) {
  const isMobile = useIsMobile();
  const [type, setType] = useState<TouchpointType>('email');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactStatements, setContactStatements] = useState('');
  const [responseReceived, setResponseReceived] = useState(false);
  const [when, setWhen] = useState<Date>(new Date());
  const [nextFollowUp, setNextFollowUp] = useState<Date | undefined>(undefined);
  const [showNextFollowUp, setShowNextFollowUp] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingActivity) {
      setType(editingActivity.type as TouchpointType);
      setTitle(editingActivity.title);
      
      // Parse existing description to separate internal notes from contact statements
      const existingDesc = editingActivity.description || '';
      if (existingDesc.includes('CONTACT_STATEMENTS:')) {
        const parts = existingDesc.split('CONTACT_STATEMENTS:');
        setDescription(parts[0].replace('INTERNAL_NOTES:', '').trim());
        setContactStatements(parts[1].trim());
      } else {
        setDescription(existingDesc);
        setContactStatements('');
      }
      
      setResponseReceived(editingActivity.responseReceived);
      setWhen(editingActivity.completedAt ? new Date(editingActivity.completedAt) : new Date(editingActivity.createdAt));
      setNextFollowUp(undefined);
      setShowNextFollowUp(false);
    } else {
      // Reset form for new activity
      setType('email');
      setTitle('');
      setDescription('');
      setContactStatements('');
      setResponseReceived(false);
      setWhen(new Date());
      setNextFollowUp(undefined);
      setShowNextFollowUp(false);
    }
  }, [editingActivity, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Combine notes into structured format
    const structuredDescription = [];
    if (description.trim()) {
      structuredDescription.push(`INTERNAL_NOTES: ${description.trim()}`);
    }
    if (contactStatements.trim()) {
      structuredDescription.push(`CONTACT_STATEMENTS: ${contactStatements.trim()}`);
    }
    
    const finalDescription = structuredDescription.length > 0 
      ? structuredDescription.join(' | ') 
      : undefined;

    console.log('🔥 [ActivityDialog] Form submitted - DEBUG:', {
      type,
      title: title.trim(),
      description: finalDescription,
      responseReceived,
      when,
      nextFollowUp: showNextFollowUp ? nextFollowUp : undefined,
      showNextFollowUp,
      nextFollowUpDate: nextFollowUp,
      contact: contact?.name,
      contactId: contact?.id
    });

    onSave({
      type,
      title: title.trim(),
      description: finalDescription,
      responseReceived,
      when,
      nextFollowUp: showNextFollowUp ? nextFollowUp : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setContactStatements('');
    setResponseReceived(false);
    setWhen(new Date());
    setNextFollowUp(undefined);
    setShowNextFollowUp(false);
    onOpenChange(false);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="type">Touchpoint Type</Label>
        {editingActivity && (editingActivity.type === 'revenue' || editingActivity.type === 'status_change') ? (
          <div className="p-2 border rounded-md bg-muted">
            <Badge variant="secondary" className={
              editingActivity.type === 'revenue' 
                ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
            }>
              {editingActivity.type === 'revenue' ? <DollarSign className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
              <span className="capitalize">{editingActivity.type === 'revenue' ? 'Revenue' : 'Status Change'}</span>
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">System-generated activity type cannot be changed</p>
          </div>
        ) : (
          <Select value={type} onValueChange={(value: TouchpointType) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="email">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </div>
            </SelectItem>
            <SelectItem value="call">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Call
              </div>
            </SelectItem>
            <SelectItem value="linkedin">
              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </div>
            </SelectItem>
            <SelectItem value="social">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Social Media
              </div>
            </SelectItem>
            <SelectItem value="meeting">
              <div className="flex items-center gap-2">
                <CalendarLucide className="w-4 h-4" />
                Meeting
              </div>
            </SelectItem>
            <SelectItem value="mail">
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4" />
                Physical Mail
              </div>
            </SelectItem>
            <SelectItem value="text">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Text Message
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the touchpoint"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Internal Notes (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Internal notes about this touchpoint (not shared in AI outreach)"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactStatements">Contact Statements/Questions (Optional)</Label>
        <Textarea
          id="contactStatements"
          value={contactStatements}
          onChange={(e) => setContactStatements(e.target.value)}
          placeholder="Things they said or questions they asked that could be referenced in future outreach"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>When did this happen?</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !when && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {when ? format(when, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={when}
              onSelect={(date) => date && setWhen(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="response"
          checked={responseReceived}
          onCheckedChange={(checked) => setResponseReceived(checked === true)}
        />
        <Label htmlFor="response">They responded to this touchpoint</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="followup"
          checked={showNextFollowUp}
          onCheckedChange={(checked) => {
            setShowNextFollowUp(checked === true);
            if (!checked) {
              setNextFollowUp(undefined);
            }
          }}
        />
        <Label htmlFor="followup">Schedule next follow-up</Label>
      </div>

      {showNextFollowUp && (
        <div className="space-y-2">
          <Label>Next Follow-up Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !nextFollowUp && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {nextFollowUp ? format(nextFollowUp, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={nextFollowUp}
                onSelect={setNextFollowUp}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          {editingActivity ? 'Update' : 'Log'} Touchpoint
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{editingActivity ? 'Edit' : 'Log'} Touchpoint{contact ? ` - ${contact.name}` : ''}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-4">
            {formContent}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="activity-dialog-description">
        <DialogHeader>
          <DialogTitle>{editingActivity ? 'Edit' : 'Log'} Touchpoint{contact ? ` - ${contact.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div id="activity-dialog-description" className="sr-only">
          Log a new touchpoint or interaction with {contact ? contact.name : 'this contact'}
        </div>
        <ScrollArea className="max-h-[70vh]">
          {formContent}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
