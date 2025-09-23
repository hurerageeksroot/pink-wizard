import { useState } from "react";
import { Activity, Contact, ActivityType } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mail, Phone, MessageCircle, Calendar as CalendarIcon, Share2, Linkedin, Search, CheckCircle2, X, Edit2, Trash2, DollarSign, UserCheck, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ActivityViewDialog } from "./ActivityViewDialog";
import { ActivityDialog } from "./ActivityDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ActivitiesTableProps {
  activities: Activity[];
  contacts: Contact[];
  onActivityUpdate?: (updatedActivity: Activity) => void;
  onActivityDelete?: (activityId: string) => void;
}

export function ActivitiesTable({ activities, contacts, onActivityUpdate, onActivityDelete }: ActivitiesTableProps) {
  console.log('ActivitiesTable received:', activities.length, 'activities');
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(200);
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  const handleRowClick = (activity: Activity, e: React.MouseEvent) => {
    // Don't open view dialog if edit button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    const contact = contacts.find(c => c.id === activity.contactId);
    if (contact) {
      setSelectedActivity(activity);
      setSelectedContact(contact);
      setShowActivityDialog(true);
    }
  };

  const handleEditActivity = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    const contact = contacts.find(c => c.id === activity.contactId);
    if (contact) {
      setEditingActivity(activity);
      setSelectedContact(contact);
      setShowEditDialog(true);
    }
  };

  const handleSaveActivity = async (activityData: any) => {
    if (!editingActivity || !onActivityUpdate) return;

    const updatedActivity: Activity = {
      ...editingActivity,
      type: activityData.type,
      title: activityData.title,
      description: activityData.description,
      responseReceived: activityData.responseReceived,
      scheduledFor: activityData.when,
      completedAt: activityData.when, // Assuming immediate completion for now
    };

    onActivityUpdate(updatedActivity);
    setShowEditDialog(false);
    setEditingActivity(null);
  };

  const handleToggleResponse = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onActivityUpdate) return;
    
    // Only allow toggling for outreach activities (not meetings, revenue, or status changes)
    if (activity.type === 'meeting' || activity.type === 'revenue' || activity.type === 'status_change') {
      return;
    }

    const updatedActivity: Activity = {
      ...activity,
      responseReceived: !activity.responseReceived,
    };

    onActivityUpdate(updatedActivity);
  };

  const handleDeleteActivity = (activityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onActivityDelete) return;
    onActivityDelete(activityId);
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.name || 'Unknown Contact';
  };

  const getTypeIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case 'email': return <Mail {...iconProps} />;
      case 'call': return <Phone {...iconProps} />;
      case 'social': return <Share2 {...iconProps} />;
      case 'linkedin': return <Linkedin {...iconProps} />;
      case 'meeting': return <CalendarIcon {...iconProps} />;
      case 'mail': return <Mail {...iconProps} />;
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
      case 'mail': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800';
      case 'text': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800';
      case 'revenue': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30';
      case 'status_change': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const filteredActivities = activities
    .filter(activity => {
      const contactName = getContactName(activity.contactId);
      const matchesSearch = contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const activityDate = new Date(activity.completedAt || activity.createdAt);
        const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
          matchesDateRange = matchesDateRange && activityDateOnly >= fromDate;
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
          matchesDateRange = matchesDateRange && activityDateOnly <= toDate;
        }
      }
      
      return matchesSearch && matchesType && matchesDateRange;
    })
    .sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // Progressive rendering for large datasets
  const displayedActivities = filteredActivities.slice(0, visibleCount);
  const hasMoreActivities = filteredActivities.length > visibleCount;

  return (
    <Card className="bg-gradient-card border-0 shadow-card">
      <CardHeader>
        <CardTitle>All Activities ({activities.length} total)</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contacts or activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </Button>
            {/* Generate filter buttons dynamically from existing activities */}
            {Array.from(new Set(activities.map(a => a.type))).sort().map((activityType) => {
              const getFilterLabel = (type: string) => {
                switch (type) {
                  case 'email': return 'Email';
                  case 'call': return 'Calls';
                  case 'linkedin': return 'LinkedIn';
                  case 'social': return 'Social Media';
                  case 'meeting': return 'Meetings';
                  case 'mail': return 'Physical Mail';
                  case 'text': return 'Text Messages';
                  case 'revenue': return 'Revenue';
                  case 'status_change': return 'Status Changes';
                  default: return type.charAt(0).toUpperCase() + type.slice(1);
                }
              };

              return (
                <Button
                  key={activityType}
                  variant={typeFilter === activityType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(activityType)}
                >
                  {getTypeIcon(activityType)}
                  <span className="ml-1">{getFilterLabel(activityType)}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || dateRange.from || dateRange.to
                ? "No activities match your filters" 
                : "No touchpoints recorded yet"}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {displayedActivities.map((activity) => {
                const date = activity.completedAt || activity.createdAt;
                const isCompleted = !!activity.completedAt;
                
                return (
                  <TableRow 
                    key={activity.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={(e) => handleRowClick(activity, e)}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getContactName(activity.contactId)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getTypeColor(activity.type)}>
                        {getTypeIcon(activity.type)}
                        <span className="ml-1 capitalize">{activity.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{activity.title}</TableCell>
                    <TableCell>
                      {activity.type === 'meeting' || activity.type === 'revenue' || activity.type === 'status_change' ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                          n/a
                        </Badge>
                      ) : activity.responseReceived ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge 
                          variant="secondary" 
                          className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                          onClick={(e) => handleToggleResponse(activity, e)}
                          title="Click to mark as responded"
                        >
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditActivity(activity, e)}
                          className="hover:bg-muted"
                          disabled={activity.type === 'status_change'}
                          title={activity.type === 'status_change' ? 'Status change activities cannot be edited' : 'Edit activity'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-muted text-destructive hover:text-destructive"
                              disabled={activity.type === 'status_change'}
                              title={activity.type === 'status_change' ? 'Status change activities cannot be deleted' : 'Delete activity'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this activity? This action cannot be undone and will update the contact's total touchpoint count.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDeleteActivity(activity.id, e)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })}
                </TableBody>
                </Table>
                </div>
                
                {/* Load More Button for Desktop */}
                {hasMoreActivities && (
                  <div className="hidden md:flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleCount(prev => prev + 200)}
                      className="gap-2"
                    >
                      Load More Activities ({filteredActivities.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
            
            {/* Load More Button for Desktop */}
            {hasMoreActivities && (
              <div className="hidden md:flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setVisibleCount(prev => prev + 200)}
                  className="gap-2"
                >
                  Load More Activities ({filteredActivities.length - visibleCount} remaining)
                </Button>
              </div>
            )}
            
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {displayedActivities.map((activity) => {
                const date = activity.completedAt || activity.createdAt;
                
                return (
                  <Card key={activity.id} className="bg-card border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getContactName(activity.contactId)} • {activity.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {activity.type === 'meeting' || activity.type === 'revenue' || activity.type === 'status_change' ? (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                              n/a
                            </Badge>
                          ) : activity.responseReceived ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                              Response
                            </Badge>
                          ) : (
                            <Badge 
                              variant="secondary"
                              className="bg-orange-100 text-orange-800 border-orange-200 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-700 transition-colors"
                              onClick={(e) => handleToggleResponse(activity, e)}
                              title="Click to mark as responded"
                            >
                              No Response
                            </Badge>
                          )}
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Load More Button for Mobile */}
            {hasMoreActivities && (
              <div className="md:hidden flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setVisibleCount(prev => prev + 200)}
                  className="gap-2"
                >
                  Load More Activities ({filteredActivities.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
        
        <ActivityViewDialog
          open={showActivityDialog}
          onOpenChange={setShowActivityDialog}
          activity={selectedActivity}
          contact={selectedContact}
        />
        
        <ActivityDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          contact={selectedContact}
          onSave={handleSaveActivity}
          editingActivity={editingActivity}
        />
      </CardContent>
    </Card>
  );
}