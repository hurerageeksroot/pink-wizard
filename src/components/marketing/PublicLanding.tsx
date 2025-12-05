import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Inbox, Calendar, DollarSign, Network, Users, Building2, UserCircle, Globe, Heart, Briefcase, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
export const PublicLanding: React.FC = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 md:py-32 relative bg-cover bg-center" style={{
      backgroundImage: `
            linear-gradient(
              135deg, 
              rgba(7, 142, 146, 0.85), 
              rgba(204, 17, 108, 0.75)
            ),
            url('/lovable-uploads/networking-hero-bg.jpg')
          `,
      backgroundBlendMode: 'multiply'
    }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 fade-in">
            <Badge className="mb-4 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Network-First CRM
            </Badge>
            
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              Build the Network That{" "}
              <span className="italic">Builds Your Future</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow">Stop waiting for business to find you. Start cultivating relationships that compound over time. Your network is your most valuable asset and we help you invest in it intentionally.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button size="lg" onClick={() => navigate('/auth?tab=signup')} className="shadow-lg hover-lift text-lg px-8">
                Join the Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-white text-sm">
                Start building your intentional network today
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-gradient-to-b from-white to-pink-50/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-foreground mb-6">
                The Cost of a Neglected Network
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                You know relationships matter. But without a system, they quietly slip away.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-hover-teal hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-teal/10 flex items-center justify-center mb-6">
                    <TrendingDown className="w-7 h-7 text-brand-teal" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Lost Opportunities
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Past clients forget about you. Referrals never materialize. Warm connections go cold because you didn't have a system to stay top-of-mind.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-teal hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
                    <Inbox className="w-7 h-7 text-brand-orange" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    The Inbound Trap
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You react to whoever reaches out instead of proactively nurturing the relationships that could transform your business or career.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-teal hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-pink/10 flex items-center justify-center mb-6">
                    <Calendar className="w-7 h-7 text-brand-pink" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Consistency Challenge
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You mean to follow up. You want to check in. But without structure, networking feels like one more thing on an endless to-do list.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-foreground mb-6">
                What if networking felt{" "}
                <span className="italic text-brand-teal-dark">intentional</span> instead of transactional?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                PinkWizard helps you turn relationships into revenue—without feeling salesy.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="card-hover-orange hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
                    <DollarSign className="w-7 h-7 text-brand-orange" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Past Clients → Repeat Revenue
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Automate follow-ups with clients who already trust you. Turn one-time projects into ongoing partnerships.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-orange hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-teal/10 flex items-center justify-center mb-6">
                    <Network className="w-7 h-7 text-brand-teal" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Your Network = Your Sales Team
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nurture connections who can refer, promote, or collaborate. Track who's most influential and stay connected.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-orange hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-pink/10 flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-brand-pink" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Build Strategic Relationships
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track who you need to know better. Schedule meaningful check-ins. Make relationship-building a habit, not a hope.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-orange hover-lift bg-card border-border">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-lime/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-brand-lime" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Community Advantage
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gamified challenges keep you motivated. See how you stack up and celebrate wins with peers who get it.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="bg-gradient-to-b from-white to-teal-50/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-foreground mb-6">
                Built for Relationship-Led Growth
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Whether you're building a business, a community, or a movement—intentional relationships are your unfair advantage.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Small Businesses</h3>
                  <p className="text-sm text-muted-foreground">Turn past customers into repeat revenue and referrals</p>
                </CardContent>
              </Card>

              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-brand-orange" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Event Professionals</h3>
                  <p className="text-sm text-muted-foreground">Fill your calendar by staying top-of-mind year-round</p>
                </CardContent>
              </Card>

              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-pink/10 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-brand-pink" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Consultants & Coaches</h3>
                  <p className="text-sm text-muted-foreground">Build a pipeline of warm leads through consistent outreach</p>
                </CardContent>
              </Card>

              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-lime/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-brand-lime" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Nonprofits</h3>
                  <p className="text-sm text-muted-foreground">Deepen donor relationships and increase retention</p>
                </CardContent>
              </Card>

              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-coral/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-brand-coral" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Community Organizers</h3>
                  <p className="text-sm text-muted-foreground">Keep members engaged and build lasting connections</p>
                </CardContent>
              </Card>

              <Card className="card-hover-pink hover-lift bg-card/80 backdrop-blur border-border">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-teal-dark/10 flex items-center justify-center mx-auto mb-4">
                    <UserCircle className="w-6 h-6 text-brand-teal-dark" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Personal Brands</h3>
                  <p className="text-sm text-muted-foreground">Grow your influence by nurturing genuine connections</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-playfair text-3xl md:text-5xl font-bold text-foreground mb-6">
                What Happens When You Invest in Your Network
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Transform how you build and maintain professional relationships
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card border-border card-hover-teal">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-teal/10 flex items-center justify-center mb-6">
                    <Calendar className="w-7 h-7 text-brand-teal" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-4 text-foreground">
                    Never Miss a Follow-Up
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Automated reminders and smart scheduling help you stay consistent with outreach, turning good intentions into actual connections.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border card-hover-orange">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
                    <Network className="w-7 h-7 text-brand-orange" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-4 text-foreground">
                    Track What Matters
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    See at a glance which relationships need attention and measure the real impact of your networking efforts on your business.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border card-hover-pink">
                <CardContent className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-brand-pink/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-brand-pink" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-4 text-foreground">
                    Stay Motivated
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gamification features make relationship-building engaging and rewarding, helping you build sustainable networking habits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-email-header py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-playfair text-4xl md:text-6xl font-bold text-white leading-tight">
              Your Network Won't Grow Itself.
              <br />
              <span className="italic text-white">But it could.</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Join the waitlist and be among the first to experience relationship-led growth.
            </p>
            
            <div className="pt-6">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-white text-brand-pink hover:bg-white/90 shadow-xl hover-lift text-lg px-8 py-6">
                Reserve Your Spot on the Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-white/70 text-sm">
              Limited spots • Built by relationship-driven professionals
            </p>
          </div>
        </div>
      </section>
    </div>;
};