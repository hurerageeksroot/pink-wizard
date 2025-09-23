import { Activity, Contact } from "@/types/crm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageCircle, Calendar, Share2, Linkedin, CheckCircle2, Clock, DollarSign, UserCheck, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ActivityViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  contact: Contact | null;
}

export function ActivityViewDialog({ open, onOpenChange, activity, contact }: ActivityViewDialogProps) {
  if (!activity || !contact) return null;

  const getTypeIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case 'email': return <Mail {...iconProps} />;
      case 'call': return <Phone {...iconProps} />;
      case 'social': return <Share2 {...iconProps} />;
      case 'linkedin': return <Linkedin {...iconProps} />;
      case 'meeting': return <Calendar {...iconProps} />;
      case 'text': return <MessageSquare {...iconProps} />;
      case 'revenue': return <DollarSign {...iconProps} />;
      case 'status_change': return <UserCheck {...iconProps} />;
      default: return <MessageCircle {...iconProps} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'call': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'meeting': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'text': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800';
      case 'revenue': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30';
      case 'status_change': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const date = activity.completedAt || activity.createdAt;
  const isCompleted = !!activity.completedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activity Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
            <p className="text-lg font-medium">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.email}</p>
          </div>

          {/* Activity Type */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
            <Badge variant="secondary" className={getTypeColor(activity.type)}>
              {getTypeIcon(activity.type)}
              <span className="ml-1 capitalize">{activity.type}</span>
            </Badge>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Title</h3>
            <p className="text-sm">{activity.title}</p>
          </div>

          {/* Description */}
          {activity.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
            </div>
          )}

          {/* Date */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Date</h3>
            <p className="text-sm">{format(new Date(date), "PPP")}</p>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
            {isCompleted ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Scheduled
              </Badge>
            )}
          </div>

          {/* Response */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Response Received</h3>
            {activity.responseReceived ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                No
              </Badge>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}