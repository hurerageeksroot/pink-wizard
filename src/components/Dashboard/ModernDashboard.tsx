import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRMStats, Contact, Activity } from "@/types/crm";
import type { ExternalOutreachCounts } from "@/components/ExternalCountsBridge";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Users,
  Target,
  TrendingUp,
  Calendar,
  ArrowRight,
  Zap,
  CheckCircle,
  Clock,
  MessageSquare,
  Heart,
  Plus,
  Filter,
  BarChart3,
  BookOpen,
  DollarSign,
  AlertCircle,
  Activity as ActivityIcon,
  UserPlus,
} from "lucide-react";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { BadgeNotificationFix } from "@/components/BadgeNotificationFix";
import { TaskProgressCard } from "@/components/TaskProgressCard";
import { OnboardingTasks } from "@/components/OnboardingTasks";
import { PersonalTasks } from "@/components/PersonalTasks";
import { WeeklyTasks } from "@/components/WeeklyTasks";
import { ProgramTasks } from "@/components/ProgramTasks";
import { DailyTasks } from "@/components/DailyTasks";
import { PointsCard } from "@/components/PointsCard";
import { ContactList } from "@/components/ContactList";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { TokenBreakdownCard } from "@/components/TokenBreakdownCard";
import { AIQuotaCard } from "@/components/AIQuotaCard";
import { CoachBanner } from "@/components/CoachBanner";
import { ContactRevenue } from "@/components/ContactRevenue";
import { ChallengeWelcomeBanner } from "@/components/ChallengeWelcomeBanner";
import { ChallengeAccessGate } from "@/components/ChallengeAccessGate";

interface ModernDashboardProps {
  stats: CRMStats;
  contacts: Contact[];
  activities: Activity[];
  onShowBookings?: () => void;
  externalCounts?: ExternalOutreachCounts | null;
  isEmbeddedMode?: boolean;
  onNavigateToAI?: () => void;
  onAddContact?: () => void;
  canWrite: boolean;
  hasRealData: boolean;
  showDemoData: boolean;
  setShowDemoData: (show: boolean) => void;
  isChallengeParticipant: boolean;
}

export function ModernDashboard({
  stats,
  contacts,
  activities,
  onShowBookings,
  externalCounts,
  isEmbeddedMode,
  onNavigateToAI,
  onAddContact,
  canWrite,
  hasRealData,
  showDemoData,
  setShowDemoData,
  isChallengeParticipant,
}: ModernDashboardProps) {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState<
    "today" | "week" | "month"
  >("today");

  // Calculate insights
  const readyContacts = contacts.filter((c) => {
    // Exclude contacts marked as "not a fit"
    if (c.status === "lost_not_fit") {
      return false;
    }

    // Contact is ready if they have a follow-up date that is due (today or in the past)
    if (c.nextFollowUp) {
      const followUpDate = new Date(c.nextFollowUp);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return followUpDate <= today;
    }

    // If no follow-up date is set, they're not ready for outreach
    return false;
  });

  const recentActivities = activities
    .filter((a) => a.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    )
    .slice(0, 5);

  const todaysActivities = activities.filter((a) => {
    if (!a.completedAt) return false;
    const today = new Date();
    const activityDate = new Date(a.completedAt);
    return activityDate.toDateString() === today.toDateString();
  });

  const conversionRate =
    stats.totalContacts > 0
      ? (contacts.filter((c) => c.status === "won").length /
          stats.totalContacts) *
        100
      : 0;

  // Compute metrics based on selected date range
  const displayMetrics = useMemo(() => {
    switch (selectedRange) {
      case "today":
        return {
          newContacts: stats.todayNewContacts,
          followUpsCompleted: stats.todayFollowUpsCompleted,
          missedFollowUps: stats.thisWeekFollowUpsMissed, // Overdue is always current
          totalActivities: todaysActivities.length,
        };
      case "week":
        return {
          newContacts: stats.thisWeekNewContacts,
          followUpsCompleted: stats.thisWeekFollowUpsCompleted,
          missedFollowUps: stats.thisWeekFollowUpsMissed,
          totalActivities: stats.thisWeekActivities,
        };
      case "month":
        return {
          newContacts: stats.thisMonthNewContacts,
          followUpsCompleted: stats.thisMonthFollowUpsCompleted,
          missedFollowUps: stats.thisMonthFollowUpsMissed,
          totalActivities: stats.thisMonthActivities,
        };
    }
  }, [selectedRange, todaysActivities.length, stats]);

  return (
    <div className="space-y-8">
      {/* Demo Data Toggle - Only show when no real data exists */}
      {!hasRealData && (
        <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Demo Data</h4>
                <p className="text-xs text-muted-foreground">
                  {showDemoData
                    ? "Viewing sample data to explore features"
                    : "Add your first contact to get started"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="demo-toggle"
                  className="text-sm text-muted-foreground"
                >
                  Show demo
                </label>
                <Switch
                  id="demo-toggle"
                  checked={showDemoData}
                  onCheckedChange={setShowDemoData}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Header */}
      <div
        style={{
          border: "1px solid var(--borderLight)",
          borderRadius: "10px",
          backgroundColor: "#fff",
          padding: "20px 25px 20px 25px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Your Outreach Command Center
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform connections into opportunities with magical precision ✨
          </p>
        </div>

        {/* Key Metrics Hero Section */}
        <div className="key-metrics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Section 1 - Column 1: First 2 metric cards */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card className="relative overflow-hidden bg-primary border-2 border-primary shadow-elevated">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-primary-foreground/80 text-xs font-medium mb-1">
                        Total Network
                      </div>
                      <div className="text-lg sm:text-xl lg:text-3xl font-bold text-primary-foreground">
                        {stats.totalContacts}
                      </div>
                      <div className="text-primary-foreground/70 text-xs mt-1 truncate">
                        contacts managed
                      </div>
                    </div>
                    <div className="p-2 bg-primary-foreground/20 rounded-lg sm:rounded-xl shrink-0">
                      <Users className="h-4 w-4 lg:h-6 lg:w-6 text-primary-foreground/80" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="relative overflow-hidden bg-secondary border-2 border-secondary shadow-elevated cursor-pointer"
                onClick={onShowBookings}
              >
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-secondary-foreground/80 text-xs font-medium mb-1">
                        Bookings
                      </div>
                      <div className="text-lg sm:text-xl lg:text-3xl font-bold text-secondary-foreground">
                        {stats.bookingsScheduled}
                      </div>
                      <div className="text-secondary-foreground/70 text-xs mt-1 truncate">
                        this period
                      </div>
                    </div>
                    <div className="p-2 bg-secondary-foreground/20 rounded-lg sm:rounded-xl shrink-0">
                      <Calendar className="h-4 w-4 lg:h-6 lg:w-6 text-secondary-foreground/80" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 1 - Column 2: Last 2 metric cards */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card className="relative overflow-hidden bg-accent border-2 border-accent shadow-elevated">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-accent-foreground/80 text-xs font-medium mb-1">
                        Response Rate
                      </div>
                      <div className="text-lg sm:text-xl lg:text-3xl font-bold text-accent-foreground">
                        {stats.responseRate.toFixed(1)}%
                      </div>
                      <div className="text-accent-foreground/70 text-xs mt-1 truncate">
                        engagement level
                      </div>
                    </div>
                    <div className="p-2 bg-accent-foreground/20 rounded-lg sm:rounded-xl shrink-0">
                      <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-accent-foreground/80" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-muted/30 border-2 border-primary shadow-elevated">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-muted-foreground text-xs font-medium mb-1">
                        Conversion
                      </div>
                      <div className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground">
                        {conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground text-xs mt-1 truncate">
                        lead to client
                      </div>
                    </div>
                    <div className="p-2 bg-primary/20 rounded-lg sm:rounded-xl shrink-0">
                      <Target className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2 - Column 3: Revenue Card */}
            <div className="lg:col-span-1">
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-elevated h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-amber-800 text-xs font-medium mb-1">
                        Total Revenue
                      </div>
                      <div className="text-lg sm:text-xl lg:text-3xl font-bold text-amber-900">
                        $
                        {contacts
                          .reduce(
                            (total, contact) =>
                              total + (contact.revenueAmount || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                      <div className="text-amber-700 text-xs mt-1 truncate">
                        from won deals
                      </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg sm:rounded-xl shrink-0">
                      <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-amber-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onNavigateToAI}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 shadow-md"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate AI Outreach
            </Button>

            <Button
              onClick={() => navigate("/resources")}
              variant="outline"
              className="w-full h-12 border-primary text-primary hover:bg-primary/10 hover:border-primary/80"
              size="lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Resource Center
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-10 border-secondary text-secondary hover:bg-secondary/10 hover:border-secondary/80"
                onClick={onAddContact || (() => navigate("/?tab=contacts"))}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>

              <Button
                variant="outline"
                className="h-10 border-accent text-accent hover:bg-accent/10 hover:border-accent/80"
                onClick={() => {
                  navigate("/?tab=contacts&filter=ready");
                  setTimeout(
                    () => window.scrollTo({ top: 0, behavior: "smooth" }),
                    100
                  );
                }}
              >
                <Target className="w-4 h-4 mr-1" />
                Ready Leads
                {readyContacts.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {readyContacts.length}
                  </Badge>
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full border border-primary text-primary hover:bg-primary/10 hover:border-primary/80"
              onClick={() => navigate("/?tab=tasks")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isChallengeParticipant === true
                ? "View Challenge Tasks"
                : "View Tasks"}
            </Button>
          </CardContent>
        </Card>

        {/* Progress with Date Range Selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progress
              </CardTitle>

              <Tabs
                value={selectedRange}
                onValueChange={(v) =>
                  setSelectedRange(v as "today" | "week" | "month")
                }
              >
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* New Contacts */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <div className="text-sm text-muted-foreground">
                    New Contacts
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {displayMetrics.newContacts}
                </div>
              </div>

              {/* Follow-ups Completed */}
              <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <div className="text-sm text-muted-foreground">
                    Follow-ups Done
                  </div>
                </div>
                <div className="text-3xl font-bold text-secondary">
                  {displayMetrics.followUpsCompleted}
                </div>
              </div>

              {/* Missed Follow-ups */}
              <div
                className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl cursor-pointer hover:from-destructive/20 hover:to-destructive/10 transition-all"
                onClick={() => navigate("/?tab=contacts&filter=overdue")}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <div className="text-sm text-muted-foreground">
                    Missed Follow-ups
                  </div>
                </div>
                <div className="text-3xl font-bold text-destructive">
                  {displayMetrics.missedFollowUps}
                </div>
              </div>

              {/* Total Activities */}
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ActivityIcon className="h-4 w-4 text-accent" />
                  <div className="text-sm text-muted-foreground">
                    Total Activities
                  </div>
                </div>
                <div className="text-3xl font-bold text-accent">
                  {displayMetrics.totalActivities}
                </div>
              </div>
            </div>

            {/* Ready to Contact Banner */}
            {readyContacts.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      Time to reach out!
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {readyContacts.length} contact
                      {readyContacts.length !== 1 ? "s" : ""} ready for
                      follow-up
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/?tab=contacts")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    View Contacts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Display */}
        <BadgeNotificationFix />
        <div className="space-y-4">
          <BadgeDisplay />
        </div>

        {/* Pipeline Health */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-cold"></div>
                  <span className="text-sm font-medium">Cold Leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(stats.coldLeads / stats.totalContacts) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-bold min-w-[2rem]">
                    {stats.coldLeads}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-warm"></div>
                  <span className="text-sm font-medium">Warm Leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(stats.warmLeads / stats.totalContacts) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-bold min-w-[2rem]">
                    {stats.warmLeads}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-hot"></div>
                  <span className="text-sm font-medium">Hot Leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(stats.hotLeads / stats.totalContacts) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm font-bold min-w-[2rem]">
                    {stats.hotLeads}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Right Column - Activity & Leaderboard */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 3).map((activity) => {
                    const contact = contacts.find(
                      (c) => c.id === activity.contactId
                    );
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {activity.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {contact?.name} •{" "}
                            {activity.completedAt
                              ? new Date(
                                  activity.completedAt
                                ).toLocaleDateString()
                              : "Scheduled"}
                          </div>
                        </div>
                        {activity.responseReceived && (
                          <Badge variant="secondary" className="text-xs">
                            Response
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Start reaching out to see your activity here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Widget */}
          <LeaderboardWidget />
        </div>
      </div>

      {/* External Counts (if in embedded mode) */}
      {isEmbeddedMode && externalCounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Challenge Progress
              <Badge variant="secondary">Day {externalCounts.day}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-cold/10 to-cold/5 rounded-xl border border-cold/20">
                <div className="text-3xl font-bold text-cold mb-2">
                  {externalCounts.coldOutreach}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cold Outreach
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-warm/10 to-warm/5 rounded-xl border border-warm/20">
                <div className="text-3xl font-bold text-warm mb-2">
                  {externalCounts.nurturingOutreach}
                </div>
                <div className="text-sm text-muted-foreground">Nurturing</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-hot/10 to-hot/5 rounded-xl border border-hot/20">
                <div className="text-3xl font-bold text-hot mb-2">
                  {externalCounts.totalOutreach}
                </div>
                <div className="text-sm text-muted-foreground">Total Today</div>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(externalCounts.lastUpdated).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
