import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, Activity, TrendingUp, Mail, Trophy, Target, DollarSign, Calendar, Award, Zap, Shield, RefreshCw } from "lucide-react";
import { useAuthAnalytics } from "@/hooks/useAuthAnalytics";

interface UserPointAnalytics {
  user_id: string;
  display_name: string;
  total_points: number;
  total_activities: number;
  total_revenue: number;
  events_booked: number;
  contacts_count: number;
  win_rate: number;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_contacts: number;
  total_activities: number;
  total_points: number;
  active_challenge_participants: number;
  total_badges_earned: number;
  total_rewards_claimed: number;
  total_networking_events: number;
  total_revenue: number;
  total_content_pages: number;
  total_email_logs: number;
  avg_user_engagement: number;
}

export default function ComprehensiveAnalytics() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserPointAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  const { authStats, loading: authLoading, error: authError, refreshAuthStats } = useAuthAnalytics();

  useEffect(() => {
    fetchComprehensiveStats();
    fetchUserGrowthData();
    fetchActivityData();
    fetchUserAnalytics();
  }, []);

  const fetchComprehensiveStats = async () => {
    try {
      // Use consolidated RPC function for efficiency
      const { data, error } = await supabase.rpc('get_admin_comprehensive_stats');
      
      if (error) throw error;

      const stats = data as any; // Type assertion for RPC result

      setStats({
        total_users: stats.total_users || 0,
        total_contacts: stats.total_contacts || 0,
        total_activities: stats.total_activities || 0,
        total_points: stats.total_points || 0,
        active_challenge_participants: stats.active_challenge_participants || 0,
        total_badges_earned: stats.total_badges_earned || 0,
        total_rewards_claimed: 0, // Not tracked yet
        total_networking_events: stats.total_networking_events || 0,
        total_revenue: stats.total_revenue || 0,
        total_content_pages: 0, // Not tracked yet
        total_email_logs: stats.total_email_logs || 0,
        avg_user_engagement: stats.avg_user_engagement || 0
      });
    } catch (error) {
      console.error('Error fetching comprehensive stats:', error);
    }
  };

  const fetchUserGrowthData = async () => {
    try {
      // Use efficient RPC function
      const { data, error } = await supabase.rpc('get_admin_user_growth_data');
      
      if (error) throw error;

      setUserGrowthData((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching user growth data:', error);
    }
  };

  const fetchActivityData = async () => {
    try {
      // Use efficient RPC function
      const { data, error } = await supabase.rpc('get_admin_activity_breakdown');
      
      if (error) throw error;

      setActivityData((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Use efficient RPC function that does server-side aggregation
      const { data, error } = await supabase.rpc('get_admin_user_analytics');
      
      if (error) throw error;

      const analyticsArray: UserPointAnalytics[] = data?.map(user => ({
        user_id: user.user_id,
        display_name: user.display_name || 'Unknown User',
        total_points: Number(user.total_points) || 0,
        total_activities: Number(user.total_activities) || 0,
        total_revenue: Number(user.total_revenue) || 0,
        events_booked: Number(user.events_booked) || 0,
        contacts_count: Number(user.contacts_count) || 0,
        win_rate: Number(user.win_rate) || 0,
        created_at: user.created_at
      })) || [];

      setUserAnalytics(analyticsArray);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into platform performance and user engagement
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_challenge_participants || 0} in active challenge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats?.total_revenue) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats?.total_contacts || 0} contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_activities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(Number(stats?.avg_user_engagement) || 0)} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_points || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_badges_earned || 0} badges earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networking Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_networking_events || 0}</div>
            <p className="text-xs text-muted-foreground">Events logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Communications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_email_logs || 0}</div>
            <p className="text-xs text-muted-foreground">Emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Claimed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_rewards_claimed || 0}</div>
            <p className="text-xs text-muted-foreground">Total rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Pages</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_content_pages || 0}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>
      </div>

      {/* Auth Health Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auth Health (24h)</CardTitle>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshAuthStats}
              disabled={authLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${authLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authError ? (
            <div className="text-sm text-destructive">
              Error loading auth data
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-green-600">
                  {authStats.success_count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Success
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-lg font-bold ${authStats.error_count > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {authStats.error_count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Errors
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {authStats.error_rate}% error rate
                </div>
                <div className="text-xs text-muted-foreground">
                  {authStats.total_requests.toLocaleString()} total
                </div>
              </div>
              {authStats.errors_4xx > 0 || authStats.errors_5xx > 0 ? (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-500">4xx: {authStats.errors_4xx}</span>
                    <span className="text-red-600">5xx: {authStats.errors_5xx}</span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="activities">Activity Breakdown</TabsTrigger>
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth (Last 12 Months)</CardTitle>
              <CardDescription>
                New user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Types (Last 30 Days)</CardTitle>
                <CardDescription>
                  Distribution of user activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
                <CardDescription>
                  Activity type breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {activityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Performance Analytics</CardTitle>
                <CardDescription>
                  Comprehensive view of all user point accumulation, revenue, and engagement metrics
                </CardDescription>
              </div>
              <Button onClick={fetchUserAnalytics} disabled={analyticsLoading}>
                <Zap className="h-4 w-4 mr-2" />
                {analyticsLoading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-right p-4 font-medium">Points</th>
                        <th className="text-right p-4 font-medium">Activities</th>
                        <th className="text-right p-4 font-medium">Contacts</th>
                        <th className="text-right p-4 font-medium">Revenue</th>
                        <th className="text-right p-4 font-medium">Booked</th>
                        <th className="text-right p-4 font-medium">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAnalytics.map((user) => (
                        <tr key={user.user_id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {user.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{user.display_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.user_id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="font-semibold">{user.total_points.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Activity className="h-4 w-4 text-blue-500" />
                              <span>{user.total_activities}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Users className="h-4 w-4 text-green-500" />
                              <span>{user.contacts_count}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">
                                {formatCurrency(user.total_revenue)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span>{user.events_booked}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Target className="h-4 w-4 text-red-500" />
                              <span className={`font-medium ${
                                user.win_rate >= 20 ? 'text-green-600' : 
                                user.win_rate >= 10 ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {user.win_rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {userAnalytics.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No user analytics data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}