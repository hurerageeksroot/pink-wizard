import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminData } from '@/hooks/useAdminData';
import ManualTaskCompletion from '@/components/Admin/ManualTaskCompletion';
import { BackfillRevenueActivities } from '@/components/Admin/BackfillRevenueActivities';
import { 
  Users, 
  FileText, 
  Activity, 
  CreditCard, 
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminDashboard() {
  const { adminStats, loading } = useAdminData();

  const stats = [
    {
      title: 'Total Users',
      value: adminStats.total_users,
      icon: Users,
      change: `+${adminStats.recent_signups} this week`,
      color: 'text-blue-600'
    },
    {
      title: 'Total Contacts',
      value: adminStats.total_contacts,
      icon: FileText,
      change: 'Across all users',
      color: 'text-green-600'
    },
    {
      title: 'Activities',
      value: adminStats.total_activities,
      icon: Activity,
      change: 'Total logged',
      color: 'text-purple-600'
    },
    {
      title: 'Active Challenges',
      value: adminStats.active_challenges,
      icon: TrendingUp,
      change: 'Users participating',
      color: 'text-orange-600'
    },
    {
      title: 'Recent Signups',
      value: adminStats.recent_signups,
      icon: UserPlus,
      change: 'Last 7 days',
      color: 'text-pink-600'
    },
    {
      title: 'Payments',
      value: adminStats.total_payments,
      icon: CreditCard,
      change: 'Total processed',
      color: 'text-emerald-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your application metrics and management tools.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application metrics and management tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ManualTaskCompletion />
        
        <BackfillRevenueActivities />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <a 
                href="/admin/users"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Manage Users</span>
              </a>
              <a 
                href="/admin/content"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Edit Content</span>
              </a>
              <a 
                href="/admin/analytics"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span>View Analytics</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Available</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}