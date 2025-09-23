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
  description: "Organize and track your professional network with precision",
  icon: Users,
  items: ["Comprehensive contact profiles with custom fields", "Relationship status tracking (Cold, Warm, Hot, Won)", "Smart contact categorization and filtering", "Quick notes and interaction history", "Contact search and advanced filtering"]
}, {
  id: "activities",
  title: "Activities & Timeline",
  description: "Never miss a follow-up with detailed activity tracking",
  icon: Activity,
  items: ["Log touchpoints across all communication channels", "Automatic follow-up reminders and cadence suggestions", "Response tracking and engagement metrics", "Visual timeline of all interactions", "Activity analytics and insights"]
}, {
  id: "tasks",
  title: "Tasks & Routines",
  description: "Stay organized with intelligent task management",
  icon: CheckSquare,
  items: ["Daily outreach tasks with smart prioritization", "Follow-up cadence automation and suggestions", "Personal and program-based task creation", "Progress tracking with streak counters", "Weekly goal setting and achievement tracking"]
}, {
  id: "ai-outreach",
  title: "AI Outreach Generation",
  description: "Create personalized messages with AI assistance",
  icon: Sparkles,
  items: ["AI-powered message generation via token system", "Personalized content based on contact data", "Multiple message variations and A/B testing", "Token-efficient generation (≈1,500 tokens per message)", "Note: Messages generated in-app, not sent directly"]
}, {
  id: "analytics",
  title: "Dashboard & Analytics",
  description: "Data-driven insights to optimize your outreach",
  icon: BarChart3,
  items: ["Real-time activity dashboards and trends", "Outreach mix analysis and optimization suggestions", "Response rate tracking and conversion metrics", "Leaderboard integration for team motivation", "Custom reporting and performance insights"]
}, {
  id: "gamification",
  title: "Gamification & Motivation",
  description: "Stay motivated with points, badges, and rewards",
  icon: Trophy,
  items: ["Points system for all outreach activities", "Achievement badges and milestone recognition", "Weekly challenges and goal tracking", "Streak counters for consistency building", "Reward notifications and progress celebrations"]
}, {
  id: "revenue",
  title: "Revenue & Outcomes",
  description: "Track deals and measure business impact",
  icon: DollarSign,
  items: ["Won opportunity tracking and revenue recording", "Deal pipeline management and conversion tracking", "ROI analysis on outreach activities", "Revenue goals and achievement tracking", "Business outcome correlation analysis"]
}, {
  id: "community",
  title: "Community & Content",
  description: "Learn and share with other professionals",
  icon: MessageSquare,
  items: ["Community feed with networking tips and insights", "Resource library with templates and guides", "Best practice sharing and peer learning", "Industry-specific content and strategies", "Expert advice and success stories"]
}, {
  id: "security",
  title: "Security & Access",
  description: "Enterprise-grade security and data protection",
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
            Outbound Relationship Management
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Your favorite tool for the most hated tasks.</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Make outreach feel doable. PinkWizard turns cold starts and forgotten follow‑ups into a simple daily rhythm that grows repeat and referral revenue.
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8">
            The cost of silence is compounding—every day a warm contact goes cold, someone else wins the repeat business.
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
                  <h3 className="font-semibold mb-2">Outreach avoidance</h3>
                  <p className="text-sm text-muted-foreground">Cold outreach feels awkward—and the blank page is brutal.</p>
                </div>
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold mb-2">Inconsistent follow‑up</h3>
                  <p className="text-sm text-muted-foreground">Warm relationships fade without a system.</p>
                </div>
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold mb-2">Wrong tool</h3>
                  <p className="text-sm text-muted-foreground">Traditional tools are built for inbound funnels, not relationship‑led sales.</p>
                </div>
              </div>
            </div>

            {/* The Consequences */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-orange-600">The consequences</h2>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">Missed repeat business from past clients</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">"We should catch up soon" that never happens</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm">Invisible pipeline; inconsistent revenue</p>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6 text-primary">The solution</h2>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Daily Game Plan</h3>
                  <p className="text-sm text-muted-foreground">Your top 5–10 people to contact, prioritized by relationship and status.</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">Smart Cadence</h3>
                  <p className="text-sm text-muted-foreground">Relationship‑ and status‑based follow‑ups so no one slips through the cracks.</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2">AI Assist + Timeline + Motivation</h3>
                  <p className="text-sm text-muted-foreground">On‑brand message starters, unified touchpoint tracking, and points that make consistency a habit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why PinkWizard is Different */}
        <div className="mb-20 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why PinkWizard is different</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Built for outbound relationship management, not just inbound leads</h3>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Relationship‑first logic: past clients, strategic partners, referral partners, friends & family—each with the right cadence</h3>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fun and human: a friendly interface that makes outreach feel doable (and even enjoyable)</h3>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Outcomes you care about: track won revenue and referral impact</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Who it's for */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who it's for</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Event professionals, agencies, and studios</h3>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Consultants and service businesses selling to companies</h3>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Founders and freelancers growing through relationships</h3>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Anyone whose next deal is more likely to come from a person they know</h3>
            </Card>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Import & Tag</h3>
              <p className="text-muted-foreground text-sm">Import your contacts (or add as you go) and tag relationship + status</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Get Recommendations</h3>
              <p className="text-muted-foreground text-sm">PinkWizard recommends who to reach out to today and why</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Take Action & Track</h3>
              <p className="text-muted-foreground text-sm">Use a message starter, log the touchpoint, keep your streak—and watch your warm pipeline grow</p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What people are saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"We finally stopped 'meaning to follow up.' PinkWizard made it a habit."</p>
              <div className="font-semibold">— Name, Company</div>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"Repeat corporate bookings grew just by staying in touch weekly."</p>
              <div className="font-semibold">— Name, Role</div>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">"The first outreach tool that actually makes this feel doable."</p>
              <div className="font-semibold">— Name, Consultant</div>
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
          <h2 className="text-3xl font-bold mb-4">Ready to transform your networking?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start with our affordable base plan and add AI tokens as you need them for personalized outreach campaigns.
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