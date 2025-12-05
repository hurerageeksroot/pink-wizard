import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  Settings as SettingsIcon,
  Globe,
  Mail,
  Bell,
  Database,
  Key,
  Palette,
  Users,
  Shield,
  Save,
  RefreshCw,
  Trophy,
  Send,
  Bot
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ChallengeEmailBroadcast } from '@/components/Admin/ChallengeEmailBroadcast';
import { ChallengePrizeManager } from '@/components/Admin/ChallengePrizeManager';
import { BusinessGoalsImport } from '@/components/Admin/BusinessGoalsImport';
import { AIInstructionsManager } from '@/components/Admin/AIInstructionEditor';
import { RelationshipTypeManager } from '@/components/Admin/RelationshipTypeManager';
import { ContactContextManager } from '@/components/Admin/ContactContextManager';
import { RelationshipStatusManager } from '@/components/Admin/RelationshipStatusManager';
import { AdminErrorBoundary } from '@/components/Admin/AdminErrorBoundary';

export function Settings() {
  const { loading } = useAdminData();
  const { toast } = useToast();

  // Mock settings data - in a real app, this would come from your settings service
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'PinkWizard Platform',
    siteDescription: 'Professional outreach platform for growing businesses',
    contactEmail: 'admin@example.com',
    timezone: 'UTC',
    language: 'en',
    maintenanceMode: false,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.example.com',
    smtpPort: '587',
    fromEmail: 'noreply@example.com',
    fromName: 'PinkWizard Platform',
    enableEmailNotifications: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    userRegistrations: true,
    paymentAlerts: true,
    securityAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
  });

  const [brandingSettings, setBrandingSettings] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    logo: '',
    favicon: '',
    customCSS: '',
  });

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="ai-generator" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="challenge" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenge
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable to restrict access during updates
                  </div>
                </div>
                <Switch 
                  checked={generalSettings.maintenanceMode} 
                  onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <Button onClick={() => handleSaveSettings('General')}>
                <Save className="mr-2 h-4 w-4" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Relationship & Contact Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdminErrorBoundary>
                <RelationshipTypeManager />
              </AdminErrorBoundary>
              {/* Contact Context Tags - Also available in user settings */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Manage contact context tags (also accessible to users in Settings → Tags)
                  </p>
                </div>
                <AdminErrorBoundary>
                  <ContactContextManager />
                </AdminErrorBoundary>
              </div>
              {/* Add RelationshipStatusManager here */}
              <div className="border-t pt-6">
                <AdminErrorBoundary>
                  <RelationshipStatusManager />
                </AdminErrorBoundary>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow the system to send email notifications
                  </div>
                </div>
                <Switch 
                  checked={emailSettings.enableEmailNotifications} 
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, enableEmailNotifications: checked }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSaveSettings('Email')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Email Settings
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">User Registrations</Label>
                    <div className="text-sm text-muted-foreground">
                      Notify when new users register
                    </div>
                  </div>
                  <Switch 
                    checked={notificationSettings.userRegistrations} 
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, userRegistrations: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Payment Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Notify about payment events and failures
                    </div>
                  </div>
                  <Switch 
                    checked={notificationSettings.paymentAlerts} 
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Security Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Notify about security events and threats
                    </div>
                  </div>
                  <Switch 
                    checked={notificationSettings.securityAlerts} 
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Updates</Label>
                    <div className="text-sm text-muted-foreground">
                      Notify about system updates and maintenance
                    </div>
                  </div>
                  <Switch 
                    checked={notificationSettings.systemUpdates} 
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemUpdates: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Reports</Label>
                    <div className="text-sm text-muted-foreground">
                      Send weekly analytics and activity reports
                    </div>
                  </div>
                  <Switch 
                    checked={notificationSettings.weeklyReports} 
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Notification')}>
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={brandingSettings.primaryColor}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={brandingSettings.primaryColor}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={brandingSettings.secondaryColor}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={brandingSettings.secondaryColor}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    type="url"
                    value={brandingSettings.logo}
                    onChange={(e) => setBrandingSettings(prev => ({ ...prev, logo: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    type="url"
                    value={brandingSettings.favicon}
                    onChange={(e) => setBrandingSettings(prev => ({ ...prev, favicon: e.target.value }))}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={brandingSettings.customCSS}
                  onChange={(e) => setBrandingSettings(prev => ({ ...prev, customCSS: e.target.value }))}
                  placeholder="/* Add your custom CSS here */"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={() => handleSaveSettings('Branding')}>
                <Save className="mr-2 h-4 w-4" />
                Save Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generator Management */}
        <TabsContent value="ai-generator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Content Generator Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIInstructionsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenge Management */}
        <TabsContent value="challenge">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ChallengeEmailBroadcast />
              <ChallengePrizeManager />
            </div>
            <BusinessGoalsImport />
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Database Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cache Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Database className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rebuild Search Index
                </Button>
                <Button variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Generate API Keys
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">System Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Build:</span>
                    <span>2024.01.15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span>Production</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}