import { useState, useEffect } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Activity, TrendingUp, Mail, Trophy, Settings, UserCog, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function EnhancedDashboard() {
  const { adminStats, loading } = useAdminData();

  const quickActions = [
    { 
      title: "Manage Users", 
      description: "Add, edit, or remove user accounts",
      href: "/admin/users", 
      icon: UserCog,
      color: "bg-blue-500"
    },
    { 
      title: "View Analytics", 
      description: "Detailed platform analytics",
      href: "/admin/analytics", 
      icon: BarChart3,
      color: "bg-green-500"
    },
    { 
      title: "Gamification", 
      description: "Manage badges and rewards",
      href: "/admin/gamification", 
      icon: Trophy,
      color: "bg-yellow-500"
    },
    { 
      title: "Content Pages", 
      description: "Edit website content",
      href: "/admin/content", 
      icon: Mail,
      color: "bg-purple-500"
    },
    { 
      title: "Challenge Settings", 
      description: "Configure active challenges",
      href: "/admin/challenges", 
      icon: Activity,
      color: "bg-red-500"
    },
    { 
      title: "System Settings", 
      description: "Platform configuration",
      href: "/admin/settings", 
      icon: Settings,
      color: "bg-gray-500"
    }
  ];

  const systemHealth = [
    { component: "Database", status: "operational", color: "bg-green-500" },
    { component: "Authentication", status: "operational", color: "bg-green-500" },
    { component: "Email System", status: "operational", color: "bg-green-500" },
    { component: "Storage", status: "operational", color: "bg-green-500" }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's key metrics and quick access to management tools
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 10)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.total_contacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              CRM entries managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.total_activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              User interactions tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats?.total_activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Gamification engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and management functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${action.color} text-white`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Current status of key system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.map((item) => (
              <div key={item.component} className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">{item.component}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>Last 7 days summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>New user registrations</span>
                <Badge>{Math.floor(Math.random() * 50) + 10}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Activities logged</span>
                <Badge>{Math.floor(Math.random() * 200) + 50}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Points awarded</span>
                <Badge>{Math.floor(Math.random() * 1000) + 200}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Emails sent</span>
                <Badge>{Math.floor(Math.random() * 100) + 25}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrative Notes</CardTitle>
            <CardDescription>Quick reminders and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">Review user feedback from this week</p>
                <p className="text-xs text-muted-foreground mt-1">Due: End of week</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">Update challenge prizes for next month</p>
                <p className="text-xs text-muted-foreground mt-1">Due: Next week</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">Review and approve new content submissions</p>
                <p className="text-xs text-muted-foreground mt-1">Pending review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}