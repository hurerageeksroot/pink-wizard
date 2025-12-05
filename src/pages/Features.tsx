import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, CheckSquare, Zap, BarChart3, Trophy, DollarSign, MessageSquare, Shield, Code, Target, Clock, Star, Database, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
const features = [{
  id: "contacts",
  title: "Contacts & Relationships",
  description: "Your network at a glance—organized by who they are and where the relationship stands",
  icon: Users,
  items: ["Tag by relationship type: past clients, referral partners, strategic allies, donors", "Track relationship health—who's going cold, who's hot, who needs nurturing", "Comprehensive profiles with interaction history", "Smart contact categorization and filtering", "Import contacts or add as you go"]
}, {
  id: "activities",
  title: "Activities & Timeline",
  description: "Every touchpoint in one place—because relationships are built in the details",
  icon: Activity,
  items: ["Log calls, emails, coffee chats, social interactions, event attendance", "See relationship history at a glance before reaching out", "Automatic follow-up reminders based on relationship type", "Response tracking and engagement metrics", "Visual timeline of all interactions"]
}, {
  id: "tasks",
  title: "Smart Cadences & Daily Priorities",
  description: "Different relationships need different rhythms—know who to reach out to and when",
  icon: CheckSquare,
  items: ["Past clients: Monthly 'thinking of you' touches", "Referral partners: Quarterly value-sharing and reciprocity", "Strategic allies: Milestone-based check-ins", "Donors: Gratitude-first communication (not just asks)", "Daily prioritization based on relationship health"]
}, {
  id: "ai-outreach",
  title: "AI Outreach Generation",
  description: "Take the awkwardness out of 'just checking in'—sound like yourself, not a template",
  icon: Sparkles,
  items: ["Generate personalized messages that reference past conversations", "Tone matches your voice, not generic LinkedIn speak", "Re-engage past clients who've gone quiet", "Craft strategic partnership proposals", "Token-efficient generation (≈1,500 tokens per message)"]
}, {
  id: "analytics",
  title: "Network ROI & Analytics",
  description: "Track which relationship investments actually drive business outcomes",
  icon: BarChart3,
  items: ["See which relationship types drive the most repeat revenue", "Track which referral partners actually send qualified leads", "Measure donor cultivation effectiveness (nonprofits)", "Activity dashboards and engagement trends", "See your network in dollars, not just contact counts"]
}, {
  id: "gamification",
  title: "Gamification & Motivation",
  description: "Make relationship cultivation a habit, not a chore",
  icon: Trophy,
  items: ["Points for every outreach action—consistency builds compound returns", "Streaks keep you showing up even when you're busy", "Achievement badges and milestone recognition", "See your network investment pay off in real outcomes", "Weekly challenges and goal tracking"]
}, {
  id: "revenue",
  title: "Revenue & Outcomes",
  description: "Measure the real value of your network cultivation efforts",
  icon: DollarSign,
  items: ["Track repeat revenue from past client relationships", "Measure referrals and their sources", "Won opportunity tracking and deal pipeline", "See which relationship types drive the most business", "ROI analysis on network cultivation activities"]
}, {
  id: "community",
  title: "Community & Learning",
  description: "Learn relationship cultivation best practices from other professionals",
  icon: MessageSquare,
  items: ["Community feed with networking strategies and insights", "Relationship cultivation guides and frameworks", "Nonprofit-specific donor cultivation resources", "Referral partner nurturing best practices", "Expert advice and success stories"]
}, {
  id: "security",
  title: "Security & Access",
  description: "Enterprise-grade security for your most valuable asset—your network data",
  icon: Shield,
  items: ["Supabase-powered authentication and authorization", "Row-level security (RLS) for data isolation", "Least-privilege access controls", "Secure API endpoints with JWT validation", "Regular security audits and compliance monitoring"]
}];
export default function Features() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Features | PinkWizard";
  }, []);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Target className="h-4 w-4 mr-2" />
            Network Cultivation System
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Your Network is Your Biggest Asset. <em>Here's how to actually grow it.</em></h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            PinkWizard combines contact management, smart cadences, and motivational systems to help you intentionally cultivate the relationships that compound.
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8">
            Most CRMs help you manage inbound leads. PinkWizard helps you build and nurture the network that creates repeat business, referrals, and opportunities you can't predict.
          </p>
        </div>

        {/* Problem-Agitation-Solution Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            {/* The Problem */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-destructive">The problem</h2>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold mb-2">No system for your network</h3>
                  <p className="text-sm text-muted-foreground">You know networking matters, but you don't have a system for cultivating relationships.</p>
                </div>
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold mb-2">Valuable contacts fade</h3>
                  <p className="text-sm text-muted-foreground">Past clients, referral partners, and strategic allies go quiet without consistent nurturing.</p>
                </div>
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold mb-2">Traditional CRMs fail</h3>
                  <p className="text-sm text-muted-foreground">They're built for managing inbound leads, not cultivating your future network.</p>
                </div>
              </div>
            </div>

            {/* The Consequences */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-orange-600">The consequences</h2>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">Past clients forget you exist while you chase new business</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">Referral partners go quiet because you haven't stayed in touch</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">Your "network" is just a list of contacts gathering digital dust</p>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-primary">The solution</h2>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Map Your Network</h3>
                  <p className="text-sm text-muted-foreground">Organize by relationship type: past clients, referral partners, strategic allies, donors, friends.</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Smart Cadences</h3>
                  <p className="text-sm text-muted-foreground">Different relationships need different rhythms—automated follow-up reminders that match each type.</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Track Network ROI</h3>
                  <p className="text-sm text-muted-foreground">Measure which relationship investments drive repeat revenue, referrals, and partnerships.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why PinkWizard is Different */}
        <div className="mb-20 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why PinkWizard is different</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built for cultivating your network, not just managing inbound leads</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Built for OUTBOUND relationship cultivation, not inbound lead management</h3>
                <p className="text-sm text-muted-foreground">Build the relationships that FILL your funnel</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Relationship types that match real life</h3>
                <p className="text-sm text-muted-foreground">Past clients, referral partners, strategic allies, donors, advocates, and weak ties</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Smart cadences for each relationship type</h3>
                <p className="text-sm text-muted-foreground">Past clients get monthly check-ins, referral partners get quarterly value-adds, donors get gratitude-first communication</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Track your network ROI</h3>
                <p className="text-sm text-muted-foreground">See which relationship investments drive repeat revenue, referrals, and partnerships</p>
              </div>
            </div>
          </div>
        </div>

        {/* Who it's for */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who it's for</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">For anyone whose success depends on relationships, not just transactions</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Small businesses who rely on repeat clients and referrals</h3>
              <p className="text-sm text-muted-foreground">Your network drives more revenue than ads</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Event professionals, agencies, and creative studios</h3>
              <p className="text-sm text-muted-foreground">Corporate clients rebook when you stay top-of-mind</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Consultants, coaches, and service providers</h3>
              <p className="text-sm text-muted-foreground">Your reputation and referrals are your growth engine</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Nonprofits and fundraisers</h3>
              <p className="text-sm text-muted-foreground">Donor relationships require cultivation, not just asks</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Community organizers and advocates</h3>
              <p className="text-sm text-muted-foreground">Building movements requires genuine connections</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Anyone building a personal brand</h3>
              <p className="text-sm text-muted-foreground">Your network is your distribution—and your safety net</p>
            </Card>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to cultivate your network</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Map Your Network</h3>
              <p className="text-muted-foreground text-sm">Import contacts or add as you go, then tag by relationship type: past clients, referral partners, strategic allies, donors, friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Get Your Daily Game Plan</h3>
              <p className="text-muted-foreground text-sm">PinkWizard tells you who to reach out to today based on relationship type, last contact date, and status</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Take Action & Track Impact</h3>
              <p className="text-muted-foreground text-sm">Use AI for message help, log touchpoints, track outcomes—see your network ROI in real revenue and referrals</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What happens when you invest in your network</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"We closed $45K in repeat business by simply staying in touch with past clients monthly."</p>
              <div className="font-semibold">— Sarah M., Event Planner</div>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"My referral partner network now sends me 3-5 qualified leads per month—without me asking."</p>
              <div className="font-semibold">— Marcus T., Business Coach</div>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"I thought I was 'networking' on LinkedIn. PinkWizard taught me what intentional relationship building actually looks like."</p>
              <div className="font-semibold">— Jennifer K., Nonprofit Director</div>
            </Card>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold mb-8">Explore all features</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {features.map((feature, index) => <Button key={feature.id} variant="outline" size="sm" onClick={() => scrollToSection(feature.id)} className={`text-xs border-2 transition-all duration-200 hover:scale-105 ${index % 3 === 0 ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground' : index % 3 === 1 ? 'border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground' : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'}`}>
                {feature.title}
              </Button>)}
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-16 mb-16">
          {features.map((feature, index) => {
          const Icon = feature.icon;
          return <div key={feature.id} id={feature.id} className="scroll-mt-20">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {feature.items.map((item, itemIndex) => <div key={itemIndex} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{item}</span>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>
              </div>;
        })}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 border border-primary/20">
          <div className="flex justify-center mb-4">
            <Star className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to cultivate your network?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your network is your most valuable business asset. Start building it intentionally today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(user ? "/?tab=dashboard" : "/auth")} className="bg-primary">
              <Zap className="h-4 w-4 mr-2" />
              {user ? "Go to Dashboard" : "Start Free Trial"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/pricing")}>
              <DollarSign className="h-4 w-4 mr-2" />
              See Pricing
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            14‑day free trial • No credit card • Cancel anytime
          </p>
        </div>
      </div>
    </div>;
}