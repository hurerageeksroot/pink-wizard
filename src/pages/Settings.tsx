import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCRMSettings } from '@/hooks/useCRMSettings';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { CRMCadences, CadenceRule } from '@/types/crmSettings';
import { formatCadenceRule } from '@/utils/followUpCadence';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Briefcase, Database, Clock, Users, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { UserProfileUpload } from '@/components/UserProfileUpload';
import { CategoryManager } from '@/components/CategoryManager';
import { UnifiedRelationshipManager } from '@/components/Settings/UnifiedRelationshipManager';
import { ContactContextManager } from '@/components/Admin/ContactContextManager';
import { useAccess } from '@/hooks/useAccess';
import { useInboundIntegrations } from '@/hooks/useInboundIntegrations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, ExternalLink, Copy, TestTube, ArrowUpRight, ArrowDownLeft, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedRelationshipTypes } from '@/hooks/useEnhancedRelationshipTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading, saveSettings } = useCRMSettings();
  const { profile, loading: profileLoading, saveProfile } = useBusinessProfile();
  const { profile: userProfile, loading: userProfileLoading, saveProfile: saveUserProfile } = useUserProfile();
  const { hasAccess, hasSubscription, reason, createCheckout, openCustomerPortal } = useAccess();
  const { relationshipTypes, isLoading: typesLoading } = useEnhancedRelationshipTypes();
  
  const { 
    tokens, 
    loading: tokensLoading, 
    creating: creatingToken, 
    generateToken, 
    toggleToken, 
    deleteToken: deleteInboundToken, 
    updateTokenScopes,
    testInboundWebhook,
    testOutboundAPI
  } = useInboundIntegrations();
  
  const [localCadences, setLocalCadences] = useState<CRMCadences>(settings.cadences);
  const [autoEnabled, setAutoEnabled] = useState(settings.auto_followup_enabled);
  const [tokenName, setTokenName] = useState('');
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  
  // Business profile form state
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    valueProp: '',
    industry: '',
    targetMarket: '',
    keyDifferentiators: '',
  });

  // User profile form state
  const [userForm, setUserForm] = useState({
    displayName: '',
    location: '',
    avatarUrl: '',
    sidebarClickToExpand: false,
  });

  // Copy states for new integrations UI
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    setLocalCadences(settings.cadences);
    setAutoEnabled(settings.auto_followup_enabled);
  }, [settings]);

  // Load business profile data into form
  useEffect(() => {
    if (profile) {
      setBusinessForm({
        businessName: profile.businessName || '',
        valueProp: profile.valueProp || '',
        industry: profile.industry || '',
        targetMarket: profile.targetMarket || '',
        keyDifferentiators: profile.keyDifferentiators || '',
      });
    }
  }, [profile]);

  // Load user profile data into form
  useEffect(() => {
    if (userProfile) {
      setUserForm({
        displayName: userProfile.display_name || '',
        location: userProfile.location || '',
        avatarUrl: userProfile.avatar_url || '',
        sidebarClickToExpand: userProfile.sidebar_click_to_expand || false,
      });
    }
  }, [userProfile]);


  const handleCadenceChange = (
    intentGroup: keyof CRMCadences,
    statusKey: string | null,
    field: 'enabled' | 'value' | 'unit',
    value: any
  ) => {
    setLocalCadences(prev => {
      const newCadences = { ...prev };
      
      if (intentGroup === 'fallback') {
        newCadences.fallback = {
          ...newCadences.fallback,
          [field]: field === 'value' ? (value === '' ? 1 : parseInt(value) || 0) : value,
        };
      } else if (statusKey) {
        const group = newCadences[intentGroup] as any;
        if (group) {
          group[statusKey] = {
            ...group[statusKey],
            [field]: field === 'value' ? (value === '' ? 1 : parseInt(value) || 0) : value,
          };
        }
      }
      
      return newCadences;
    });
  };

  const handleSave = async () => {
    await saveSettings({
      auto_followup_enabled: autoEnabled,
      cadences: localCadences,
    });
    toast({
      title: "Settings saved",
      description: "Your platform settings have been updated successfully.",
    });
  };

  const handleBusinessSave = async () => {
    const success = await saveProfile(businessForm);
    if (success) {
      toast({
        title: "Profile updated",
        description: "Your business profile has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save business profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUserProfileSave = async () => {
    const success = await saveUserProfile({
      display_name: userForm.displayName,
      location: userForm.location,
      avatar_url: userForm.avatarUrl,
      sidebar_click_to_expand: userForm.sidebarClickToExpand,
    });
    if (success) {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (url: string, type: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    toast({
      title: "Copied!",
      description: `${type} URL copied to clipboard`,
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestOutbound = async (token: string) => {
    await testOutboundAPI(token);
  };

  const handleGenerateToken = async () => {
    if (!tokenName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the token",
        variant: "destructive",
      });
      return;
    }

    const token = await generateToken(tokenName.trim());
    if (token) {
      setGeneratedToken(token);
      setShowTokenDialog(true);
      setTokenName('');
    }
  };

  const handleTestInboundWebhook = async (token: string) => {
    await testInboundWebhook(token);
  };

  const renderCadenceControls = (rule: CadenceRule, onChange: (field: string, value: any) => void) => (
    <div className="flex items-center gap-3">
      <Switch
        checked={rule.enabled}
        onCheckedChange={(enabled) => onChange('enabled', enabled)}
      />
      {rule.enabled && (
        <>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Every</Label>
            <Input
              type="number"
              min="0"
              value={rule.value ?? 1}
              onChange={(e) => onChange('value', e.target.value)}
              className="w-16 h-8"
            />
          </div>
          <Select
            value={rule.unit || 'weeks'}
            onValueChange={(unit) => onChange('unit', unit)}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );

  if (loading || profileLoading || userProfileLoading || tokensLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, business information, and platform preferences
          </p>
        </div>

        <Tabs defaultValue="user-profile" className="w-full">
          <TabsList className="inline-flex h-auto w-full flex-wrap items-center justify-start gap-1 bg-muted/50 p-2 rounded-lg border shadow-sm">
            <TabsTrigger value="user-profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="business-profile" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Follow-ups</span>
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Relationships</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user-profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal profile information and photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <UserProfileUpload
                  currentImageUrl={userForm.avatarUrl}
                  onImageUploaded={(url) => setUserForm(prev => ({ ...prev, avatarUrl: url }))}
                  onImageRemoved={() => setUserForm(prev => ({ ...prev, avatarUrl: '' }))}
                  userInitials={userForm.displayName?.substring(0, 2).toUpperCase() || 'U'}
                />

                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={userForm.displayName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={userForm.location}
                    onChange={(e) => setUserForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter your location (e.g., New York, NY)"
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Interface Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how the application interface behaves
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sidebarMode">Click to expand sidebar</Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, click the sidebar to expand it. When disabled, hover over the sidebar to expand it.
                      </p>
                    </div>
                    <Switch
                      id="sidebarMode"
                      checked={userForm.sidebarClickToExpand}
                      onCheckedChange={(checked) => 
                        setUserForm(prev => ({ ...prev, sidebarClickToExpand: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleUserProfileSave}>
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business-profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your business information for better outreach personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessForm.businessName}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={businessForm.industry}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <Label htmlFor="targetMarket">Target Market</Label>
                  <Input
                    id="targetMarket"
                    value={businessForm.targetMarket}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, targetMarket: e.target.value }))}
                    placeholder="Describe your ideal customers"
                  />
                </div>

                <div>
                  <Label htmlFor="valueProp">Value Proposition</Label>
                  <Textarea
                    id="valueProp"
                    value={businessForm.valueProp}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, valueProp: e.target.value }))}
                    placeholder="What unique value do you provide to your customers?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="keyDifferentiators">Key Differentiators</Label>
                  <Textarea
                    id="keyDifferentiators"
                    value={businessForm.keyDifferentiators}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, keyDifferentiators: e.target.value }))}
                    placeholder="What sets you apart from competitors?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleBusinessSave}>
                    Save Business Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription, billing, and upgrade options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subscription Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {hasSubscription ? 'Pro Plan' : 'Free Plan'}
                      </p>
                    </div>
                  </div>

                  {/* Upgrade/Manage Actions */}
                  <div className="flex gap-3">
                    {!hasSubscription ? (
                      <Button 
                        onClick={async () => {
                          try {
                            const url = await createCheckout();
                            if (url) {
                              window.open(url, '_blank');
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to start checkout. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Upgrade to Pro
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const url = await openCustomerPortal();
                            if (url) {
                              window.open(url, '_blank');
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to open billing portal. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Manage Subscription
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost"
                      onClick={() => navigate('/pricing')}
                      className="flex items-center gap-2"
                    >
                      View Pricing
                    </Button>
                  </div>
                </div>

                {/* Access Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Access Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Write Access:</span>
                      <span className={`ml-2 font-medium ${hasAccess ? 'text-green-600' : 'text-orange-600'}`}>
                        {hasAccess ? 'Active' : 'Limited'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="ml-2 font-medium">{reason}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  Data & Integrations
                </CardTitle>
                <CardDescription>
                  Seamlessly send and receive data from your favorite services like Zapier, Make, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Outbound Section - Send data from PinkWizard */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-medium">Send Data to Other Apps</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your favorite automation tools to pull data from PinkWizard. Perfect for Zapier, Make.com, and other services.
                  </p>

                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Generate API Token</Label>
                        <p className="text-xs text-muted-foreground">
                          Create tokens for external services to access your data
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Token name (e.g., 'Zapier')"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                          className="w-48"
                        />
                        <Button 
                          onClick={handleGenerateToken}
                          disabled={creatingToken || !tokenName.trim()}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Generate
                        </Button>
                      </div>
                    </div>

                    {tokens.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Active Tokens</h4>
                        {tokens.map((token) => (
                          <div key={token.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{token.token_name}</span>
                                <span className="text-xs px-2 py-1 bg-secondary rounded text-secondary-foreground">
                                  {token.token_preview}
                                </span>
                                {!token.is_active && (
                                  <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Used {token.usage_count} times
                                {token.last_used_at && ` • Last used ${new Date(token.last_used_at).toLocaleDateString()}`}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Scopes:</span>
                                {token.scopes.includes('inbound') && (
                                  <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Inbound</span>
                                )}
                                {token.scopes.includes('outbound') && (
                                  <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">Outbound</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-xs">
                                  <Switch
                                    checked={token.scopes.includes('outbound')}
                                    onCheckedChange={(checked) => {
                                      const newScopes = checked 
                                        ? [...new Set([...token.scopes, 'outbound'])]
                                        : token.scopes.filter(s => s !== 'outbound');
                                      updateTokenScopes(token.id, newScopes as ('inbound' | 'outbound')[]);
                                    }}
                                    className="scale-75"
                                  />
                                  <span>Read Data</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Switch
                                    checked={token.scopes.includes('inbound')}
                                    onCheckedChange={(checked) => {
                                      const newScopes = checked 
                                        ? [...new Set([...token.scopes, 'inbound'])]
                                        : token.scopes.filter(s => s !== 'inbound');
                                      updateTokenScopes(token.id, newScopes as ('inbound' | 'outbound')[]);
                                    }}
                                    className="scale-75"
                                  />
                                  <span>Write Data</span>
                                </div>
                              </div>
                              <Button
                                onClick={() => deleteInboundToken(token.id)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Outbound API Endpoints */}
                    {tokens.some(t => t.scopes.includes('outbound')) && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">API Endpoints</h4>
                        <div className="grid gap-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                  <span className="font-medium">Contacts API</span>
                                </div>
                                <code className="text-xs font-mono text-green-600 dark:text-green-400">
                                  GET /integrations-outbound?resource=contacts
                                </code>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleCopyUrl(
                                    'https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-outbound?resource=contacts',
                                    'Contacts API'
                                  )}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-700 hover:text-green-800"
                                >
                                  {copiedUrl === 'Contacts API' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                  onClick={() => handleTestOutbound(tokens.find(t => t.scopes.includes('outbound'))?.token_preview.replace('...', '') || '')}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-700 hover:text-green-800"
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                  <span className="font-medium">Activities API</span>
                                </div>
                                <code className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                  GET /integrations-outbound?resource=activities
                                </code>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleCopyUrl(
                                    'https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-outbound?resource=activities',
                                    'Activities API'
                                  )}
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-700 hover:text-blue-800"
                                >
                                  {copiedUrl === 'Activities API' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                  onClick={() => handleTestOutbound(tokens.find(t => t.scopes.includes('outbound'))?.token_preview.replace('...', '') || '')}
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-700 hover:text-blue-800"
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">
                            <strong>Authorization:</strong> Include your token in the Authorization header
                          </p>
                          <code className="text-xs font-mono">
                            Authorization: Bearer your_token_here
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Inbound Section - Receive data into PinkWizard */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-secondary" />
                    <h3 className="text-lg font-medium">Receive Data from Other Apps</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow external services like Typeform, Google Forms, or webhooks to send contact data directly to PinkWizard.
                  </p>

                  {tokens.some(t => t.scopes.includes('inbound')) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                        <ExternalLink className="h-4 w-4" />
                        <span className="font-medium">Webhook Endpoint</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Send POST requests to this endpoint with your token:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-mono text-blue-800 dark:text-blue-200">
                          https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-inbound
                        </code>
                        <Button
                          onClick={() => handleCopyUrl(
                            'https://idwkrddbdyakmpshsvtd.supabase.co/functions/v1/integrations-inbound',
                            'Inbound Webhook'
                          )}
                          variant="ghost"
                          size="sm"
                          className="text-blue-700 hover:text-blue-800"
                        >
                          {copiedUrl === 'Inbound Webhook' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleTestInboundWebhook(tokens.find(t => t.scopes.includes('inbound'))?.token_preview.replace('...', '') || '')}
                          variant="ghost"
                          size="sm"
                          className="text-blue-700 hover:text-blue-800"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Include your token in the Authorization header: <code>Bearer your_token_here</code>
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Tool-specific recipes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Setup Recipes</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Zapier Recipe */}
                    <div className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white text-sm font-bold">Z</div>
                        <h4 className="font-medium">Zapier (Pull Data)</h4>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">1</span>
                          <span>Choose "Webhooks by Zapier" trigger</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">2</span>
                          <span>Select "Retrieve Poll"</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">3</span>
                          <span>Use the Contacts API URL above</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">4</span>
                          <span>Add Authorization header with your token</span>
                        </div>
                      </div>
                    </div>

                    {/* Make.com Recipe */}
                    <div className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-sm font-bold">M</div>
                        <h4 className="font-medium">Make.com (Pull Data)</h4>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">1</span>
                          <span>Add HTTP module</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">2</span>
                          <span>Set method to GET</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-certificate text-xs">3</span>
                          <span>Use API URL and Authorization header</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">4</span>
                          <span>Schedule to run periodically</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Display Dialog */}
            {showTokenDialog && generatedToken && (
              <Dialog open={showTokenDialog} onOpenChange={() => setShowTokenDialog(false)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-green-600">Token Generated Successfully!</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Copy this token now - you won't be able to see it again.
                    </p>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-xs font-mono break-all">{generatedToken}</code>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedToken);
                          toast({
                            title: "Copied!",
                            description: "Token copied to clipboard",
                          });
                        }}
                        className="flex-1"
                      >
                        Copy Token
                      </Button>
                      <Button
                        onClick={() => handleTestInboundWebhook(generatedToken)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <TestTube className="h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="crm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto Follow-up Cadence</CardTitle>
                <CardDescription>
                  Automatically schedule follow-up dates based on contact status and relationship type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-enabled">Enable automatic follow-ups</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, follow-up dates will be set automatically if you don't specify one
                    </p>
                  </div>
                  <Switch
                    id="auto-enabled"
                    checked={autoEnabled}
                    onCheckedChange={setAutoEnabled}
                  />
                </div>

                {autoEnabled && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Intent-Based Cadences</h3>
                      <p className="text-sm text-muted-foreground">
                        Set automatic follow-up timing for each relationship type and status
                      </p>

                      {/* Business Lead */}
                      <Collapsible defaultOpen className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <h4 className="font-medium">Business Lead</h4>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 space-y-3">
                          {Object.entries(localCadences.business_lead_statuses).map(([key, rule]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="min-w-32 capitalize">{key.replace(/_/g, ' ')}</Label>
                              {renderCadenceControls(
                                rule,
                                (field, value) => handleCadenceChange('business_lead_statuses', key, field as any, value)
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Business Nurture */}
                      <Collapsible className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <h4 className="font-medium">Business Nurture</h4>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 space-y-3">
                          {Object.entries(localCadences.business_nurture_statuses).map(([key, rule]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="min-w-32 capitalize">{key.replace(/_/g, ' ')}</Label>
                              {renderCadenceControls(
                                rule,
                                (field, value) => handleCadenceChange('business_nurture_statuses', key, field as any, value)
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Personal */}
                      <Collapsible className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <h4 className="font-medium">Personal</h4>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 space-y-3">
                          {Object.entries(localCadences.personal_statuses).map(([key, rule]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="min-w-32 capitalize">{key.replace(/_/g, ' ')}</Label>
                              {renderCadenceControls(
                                rule,
                                (field, value) => handleCadenceChange('personal_statuses', key, field as any, value)
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Civic & Community */}
                      <Collapsible className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <h4 className="font-medium">Civic & Community</h4>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 space-y-3">
                          {Object.entries(localCadences.civic_statuses).map(([key, rule]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="min-w-32 capitalize">{key.replace(/_/g, ' ')}</Label>
                              {renderCadenceControls(
                                rule,
                                (field, value) => handleCadenceChange('civic_statuses', key, field as any, value)
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Service Provider / Vendor */}
                      <Collapsible className="border rounded-lg">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            <h4 className="font-medium">Service Provider / Vendor</h4>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 pt-0 space-y-3">
                          {Object.entries(localCadences.vendor_statuses).map(([key, rule]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="min-w-32 capitalize">{key.replace(/_/g, ' ')}</Label>
                              {renderCadenceControls(
                                rule,
                                (field, value) => handleCadenceChange('vendor_statuses', key, field as any, value)
                              )}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fallback Cadence</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Used when a contact's status doesn't have a specific cadence set
                      </p>
                      <div className="flex items-center justify-between">
                        <Label>Default follow-up</Label>
                        {renderCadenceControls(
                          localCadences.fallback,
                          (field, value) => handleCadenceChange('fallback', null, field as any, value)
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave}>
                    Save Follow-up Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>

            <TabsContent value="relationships">
              <UnifiedRelationshipManager />
            </TabsContent>

            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Context Tags</CardTitle>
                  <CardDescription>
                    Create custom tags to organize and categorize your contacts. Tags can be assigned to contacts for flexible filtering and organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactContextManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Data Cleanup Section - Always visible */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Data Cleanup</CardTitle>
              <CardDescription>
                Remove demo data and sample content from your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-yellow-50/50 border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Remove Demo Data</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    This will permanently delete all demo contacts and their activities from your account. 
                    This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .rpc('remove_demo_data_for_user');
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Demo data removed",
                          description: "Removed demo contacts and their activities",
                        });
                        
                        // Refresh the page data
                        window.location.reload();
                      } catch (error) {
                        console.error('Error removing demo data:', error);
                        toast({
                          title: "Error",
                          description: "Failed to remove demo data. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Demo Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }