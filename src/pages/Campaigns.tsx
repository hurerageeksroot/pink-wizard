import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns, useCampaignStats, Campaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Calendar, TrendingUp, Edit, Archive, Target, Clock, Users, Infinity } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Intelligently abbreviate campaign goals
function abbreviateGoal(goal: string, maxLength: number = 45): string {
  if (goal.length <= maxLength) return goal;
  
  // Find last space before maxLength
  const truncated = goal.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated.trim() + '...';
}

interface CampaignFormData {
  name: string;
  description?: string;
  campaign_goal: string;
  offer_type?: 'campaign' | 'evergreen';
  event_date?: string;
  event_location?: string;
  deadline_date?: string;
  value_proposition?: string;
  key_benefits?: string;
  call_to_action?: string;
  tone?: string;
  urgency_level?: string;
  proof_points?: string;
}

function CampaignDialog({ campaign, trigger }: { campaign?: Campaign; trigger?: React.ReactNode }) {
  const { createCampaign, updateCampaign } = useCampaigns();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CampaignFormData>({
    defaultValues: campaign ? {
      name: campaign.name,
      description: campaign.description || '',
      campaign_goal: campaign.campaign_goal,
      offer_type: campaign.offer_type || 'campaign',
      event_date: campaign.event_date || '',
      event_location: campaign.event_location || '',
      deadline_date: campaign.deadline_date || '',
      value_proposition: campaign.value_proposition || '',
      key_benefits: campaign.key_benefits?.join('\n') || '',
      call_to_action: campaign.call_to_action || '',
      tone: campaign.tone || 'professional',
      urgency_level: campaign.urgency_level || 'medium',
      proof_points: campaign.proof_points?.join('\n') || '',
    } : {
      name: '',
      description: '',
      campaign_goal: '',
      offer_type: 'campaign',
      event_date: '',
      event_location: '',
      deadline_date: '',
      value_proposition: '',
      key_benefits: '',
      call_to_action: '',
      tone: 'professional',
      urgency_level: 'medium',
      proof_points: '',
    },
  });

  const onSubmit = async (data: CampaignFormData) => {
    try {
      // Validate required fields
      if (!data.campaign_goal || data.campaign_goal.trim() === '') {
        form.setError('campaign_goal', { 
          message: 'Campaign goal is required' 
        });
        return;
      }

      const campaignData = {
        ...data,
        key_benefits: data.key_benefits ? data.key_benefits.split('\n').filter(b => b.trim()) : [],
        proof_points: data.proof_points ? data.proof_points.split('\n').filter(p => p.trim()) : [],
        event_date: data.event_date || null,
        deadline_date: data.deadline_date || null,
      };

      if (campaign) {
        await updateCampaign.mutateAsync({ id: campaign.id, ...campaignData });
      } else {
        await createCampaign.mutateAsync(campaignData);
      }
      
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      toast({
        title: "Failed to save campaign",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>
            {campaign ? 'Update your campaign details' : 'Create a campaign initiative to organize your outreach efforts'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="offer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value || 'campaign'} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="campaign" id="campaign" />
                        <Label htmlFor="campaign" className="font-normal cursor-pointer">
                          Campaign (Time-Bound)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="evergreen" id="evergreen" />
                        <Label htmlFor="evergreen" className="font-normal cursor-pointer">
                          Evergreen Offer
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Campaigns have deadlines and dates. Evergreen offers are always available.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="February 2026 Networking Event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of your campaign..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaign_goal"
              rules={{ 
                required: "Goal is required",
                minLength: { value: 10, message: "Goal must be at least 10 characters" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        form.watch('offer_type') === 'evergreen'
                          ? "e.g., Book wedding photography services or schedule a consultation"
                          : "e.g., Drive attendance and sponsorship for our annual mobile bar conference"
                      }
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="space-y-2">
                    {form.watch('offer_type') === 'evergreen' ? (
                      <p>Describe what you're offering and what success looks like. Consider different objectives for different contact types.</p>
                    ) : (
                      <>
                        <p>
                          Describe the overall goal(s) of this campaign. Consider the different objectives you may have for different contact types.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> "For past clients: Attend the conference or refer peers. For potential sponsors: Partner with us at the Gold or Platinum tier. For media contacts: Cover the event or promote to their audience."
                        </p>
                      </>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('offer_type') === 'campaign' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="event_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Location or venue name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="value_proposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value Proposition (The Big Promise)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Join the industry's premier conference where you'll connect with 500+ professionals, learn from top experts, and discover trends that will transform your business." 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Write 1-3 sentences describing the overall value and why they should care. This is your elevator pitch.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2 border-t border-border/50">
              <FormField
                control={form.control}
                name="key_benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Benefits (Specific Outcomes)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Network with 500+ mobile bar professionals&#10;Learn from 10 expert speakers&#10;Free admission for past attendees&#10;Access to exclusive vendor deals" 
                        {...field} 
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>List specific, tangible things they'll get or experience. Be concrete and measurable. One per line.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="call_to_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call to Action</FormLabel>
                  <FormControl>
                    <Input placeholder="RSVP by January 15th" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="excited">Excited</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        {form.watch('offer_type') === 'evergreen' && (
                          <SelectItem value="none">None</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {form.watch('offer_type') === 'evergreen' && (
                      <FormDescription>For evergreen offers, urgency is typically low or none</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proof_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof Points</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Social proof (one per line):&#10;75 confirmed attendees&#10;3 keynote speakers&#10;Sponsored by XYZ Corp" 
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Credibility boosters (one per line)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
                {campaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate();
  const { archiveCampaign } = useCampaigns();
  const { data: stats } = useCampaignStats(campaign.id);

  const handleNavigateToAI = () => {
    navigate(`/ai-outreach?campaignId=${campaign.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              {campaign.offer_type === 'evergreen' && (
                <Badge variant="secondary" className="gap-1">
                  <Infinity className="h-3 w-3" />
                  Evergreen
                </Badge>
              )}
            </div>
            {campaign.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {campaign.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {abbreviateGoal(campaign.campaign_goal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact Stats and Dates */}
        <div className="flex flex-wrap items-center gap-2">
          {stats && stats.total_outreach > 0 && (
            <>
              <Badge variant="secondary" className="gap-1">
                <Target className="h-3 w-3" />
                {stats.total_outreach} outreach
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {stats.unique_contacts} contacts
              </Badge>
            </>
          )}
          {campaign.offer_type === 'campaign' && (
            <>
              {campaign.event_date && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(campaign.event_date), 'MMM d, yyyy')}
                </Badge>
              )}
              {campaign.deadline_date && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Deadline: {format(new Date(campaign.deadline_date), 'MMM d')}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleNavigateToAI} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            Create Outreach
          </Button>
          <CampaignDialog 
            campaign={campaign} 
            trigger={
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => archiveCampaign.mutate(campaign.id)}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Campaigns() {
  const { campaigns, isLoading } = useCampaigns();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'evergreen' | 'archived'>('campaigns');

  const activeCampaigns = campaigns?.filter(c => c.is_active && (!c.offer_type || c.offer_type === 'campaign')) || [];
  const evergreenOffers = campaigns?.filter(c => c.is_active && c.offer_type === 'evergreen') || [];
  const archivedCampaigns = campaigns?.filter(c => !c.is_active) || [];
  
  const displayCampaigns = 
    activeTab === 'campaigns' ? activeCampaigns :
    activeTab === 'evergreen' ? evergreenOffers :
    archivedCampaigns;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns & Offers</h1>
          <p className="text-muted-foreground mt-1">
            Organize your outreach with campaign-specific context for AI-generated copy
          </p>
        </div>
        <CampaignDialog />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Calendar className="h-4 w-4" />
            Active Campaigns ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="evergreen" className="gap-2">
            <Infinity className="h-4 w-4" />
            Evergreen Offers ({evergreenOffers.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedCampaigns.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : displayCampaigns.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center space-y-3">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle>
              {activeTab === 'campaigns' && 'No Active Campaigns'}
              {activeTab === 'evergreen' && 'No Evergreen Offers'}
              {activeTab === 'archived' && 'No Archived Campaigns'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'campaigns' && 'Create a time-bound campaign to organize your outreach efforts'}
              {activeTab === 'evergreen' && 'Create an evergreen offer that\'s always available'}
              {activeTab === 'archived' && 'Archived campaigns will appear here'}
            </CardDescription>
            {activeTab !== 'archived' && (
              <div className="pt-2">
                <CampaignDialog />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
