import { Activity } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageCircle, Calendar, Share2, Linkedin, CheckCircle2, Clock, DollarSign, Edit2, UserCheck, MessageSquare, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityTimelineProps {
  activities: Activity[];
  contactId: string;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
}

export function ActivityTimeline({ activities, contactId, onEditActivity, onDeleteActivity }: ActivityTimelineProps) {
  const contactActivities = activities
    .filter(activity => activity.contactId === contactId)
    .sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

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
      case 'introduction': return <Users {...iconProps} />;
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
      case 'introduction': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  if (contactActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No touchpoints recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contactActivities.map((activity, index) => {
        const date = activity.completedAt || activity.createdAt;
        const isCompleted = !!activity.completedAt;
        
        // Parse introduction data if this is an introduction
        let introData = null;
        if (activity.type === 'introduction' && activity.description) {
          try {
            const jsonMatch = activity.description.match(/INTRODUCTION_DATA: ({.+})/);
            if (jsonMatch) {
              introData = JSON.parse(jsonMatch[1]);
            }
          } catch (e) {
            console.error('Failed to parse introduction data:', e);
          }
        }
        
        return (
          <div key={activity.id} className="relative">
            {/* Timeline line */}
            {index < contactActivities.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
            )}
            
            <Card className="bg-gradient-card border-0 shadow-sm group">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getTypeColor(activity.type)}`}>
                    {getTypeIcon(activity.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <div className="flex items-center gap-2">
                        {onEditActivity && activity.type !== 'revenue' && activity.type !== 'status_change' && activity.type !== 'introduction' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditActivity(activity)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit activity"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {onDeleteActivity && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteActivity(activity.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        {activity.responseReceived && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Response
                          </Badge>
                        )}
                        {!isCompleted && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {introData && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Connected <span className="font-medium">{introData.contactA?.name || <span className="text-muted-foreground/50">[Contact Deleted]</span>}</span> with <span className="font-medium">{introData.contactB?.name || <span className="text-muted-foreground/50">[Contact Deleted]</span>}</span>
                        {introData.context && <span> — {introData.context}</span>}
                      </p>
                    )}
                    
                    {activity.description && activity.type !== 'introduction' && (
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(date), "PPp")}</span>
                      <span>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}