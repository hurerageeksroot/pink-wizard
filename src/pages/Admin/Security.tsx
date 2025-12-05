import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Eye,
  AlertTriangle,
  Activity,
  Users,
  Globe,
  RefreshCw,
  Download
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BackfillActivityPoints } from '@/components/Admin/BackfillActivityPoints';

export function Security() {
  const { loading } = useAdminData();
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  // Mock security data - in a real app, this would come from your security service
  const securityData = {
    overview: {
      securityScore: 92,
      vulnerabilities: 2,
      activeThreats: 0,
      lastSecurityScan: '2024-01-15T10:30:00Z',
    },
    vulnerabilities: [
      {
        id: 'SEC-001',
        severity: 'medium',
        title: 'Weak Password Policy',
        description: 'Some users have passwords that do not meet the current security requirements.',
        affected: 12,
        status: 'open'
      },
      {
        id: 'SEC-002',
        severity: 'low',
        title: 'Outdated Browser Detection',
        description: 'Several users are accessing the platform with outdated browsers.',
        affected: 5,
        status: 'open'
      }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'login_failed',
        user: 'john.doe@example.com',
        ip: '192.168.1.100',
        timestamp: '2024-01-15T10:15:00Z',
        risk: 'low'
      },
      {
        id: '2',
        type: 'admin_access',
        user: 'admin@example.com',
        ip: '10.0.0.50',
        timestamp: '2024-01-15T09:30:00Z',
        risk: 'medium'
      },
      {
        id: '3',
        type: 'password_change',
        user: 'sarah.smith@example.com',
        ip: '192.168.1.105',
        timestamp: '2024-01-15T08:45:00Z',
        risk: 'low'
      },
      {
        id: '4',
        type: 'multiple_login_attempts',
        user: 'suspicious.user@example.com',
        ip: '203.0.113.42',
        timestamp: '2024-01-15T07:20:00Z',
        risk: 'high'
      }
    ]
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage security settings and threats.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor security status and configure protection settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Security Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Scan
          </Button>
        </div>
      </div>

      {/* Security Overview - Updated */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              92%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+7%</span> after security fixes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              0
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">All fixed</span> - excellent!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityData.overview.activeThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              No active threats detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatDate(securityData.overview.lastSecurityScan)}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated daily scan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Integrity - Activity Points Backfill */}
      <BackfillActivityPoints />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Multi-Factor Authentication</Label>
                <div className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </div>
              </div>
              <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Audit Logging</Label>
                <div className="text-sm text-muted-foreground">
                  Log all administrative actions
                </div>
              </div>
              <Switch checked={auditLogEnabled} onCheckedChange={setAuditLogEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm">
                <Key className="mr-2 h-4 w-4" />
                Rotate API Keys
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Lock className="mr-2 h-4 w-4" />
                    Force Logout All Users
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Force Logout All Users</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately log out all users from the system. They will need to sign in again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Force Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Security Improvements Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Security Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-green-900 dark:text-green-100">
                      Critical Security Fixes Applied
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      All high-priority vulnerabilities have been resolved
                    </p>
                  </div>
                </div>
              </div>

              {[
                {
                  title: 'Database Function Security',
                  description: 'Added SET search_path to prevent privilege escalation',
                  status: 'Fixed',
                  severity: 'fixed'
                },
                {
                  title: 'RLS Policy Enhancement',
                  description: 'Content pages now require authentication',
                  status: 'Fixed',
                  severity: 'fixed'
                },
                {
                  title: 'Input Validation',
                  description: 'Enhanced validation in edge functions',
                  status: 'Fixed',
                  severity: 'fixed'
                },
                {
                  title: 'PostgreSQL Update',
                  description: 'Security patches available for database',
                  status: 'Recommended',
                  severity: 'info'
                }
              ].map((item, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <Badge variant={item.severity === 'fixed' ? 'default' : 'secondary'} 
                          className={item.severity === 'fixed' 
                            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300' 
                            : ''
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityData.recentActivity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium capitalize">
                    {activity.type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {activity.ip}
                    </code>
                  </TableCell>
                  <TableCell>{formatDate(activity.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant={getRiskColor(activity.risk)}>
                      {activity.risk} risk
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}