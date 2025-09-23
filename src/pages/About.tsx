import { Users, Target, Award, Heart, Sparkles, TrendingUp, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
export default function About() {
  const navigate = useNavigate();
  return <div className="min-h-screen">
      {/* Hero Section - Above the fold */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                About PinkWizard
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-primary">We built the outbound tool we wish existed.</h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Relationship-first outreach for event professionals and relationship-led businesses—make staying in touch your unfair advantage.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={() => navigate("/auth")} className="group">
                  Start your free trial
                  <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/features")}>
                  See how it works
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="w-full max-w-md mx-auto">
                <div className="relative">
                  <img src="/lovable-uploads/2c8ee307-822b-4078-b2dd-dd920054c54c.png" alt="Sarah M. Murphy - PinkWizard Founder" className="w-full h-auto rounded-2xl shadow-2xl" />
                  <div className="absolute -bottom-6 -right-6 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Network className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Sarah M. Murphy</p>
                        <p className="text-xs text-muted-foreground">Founder & CEO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

        {/* Problem & Solution */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">The problem we solve</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Event professionals know relationships drive business, but outreach avoidance and inconsistent follow-up leave money on the table.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-destructive font-bold text-sm">×</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Outreach avoidance</h3>
                    <p className="text-muted-foreground">Cold outreach feels awkward—and the blank page is brutal</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-destructive font-bold text-sm">×</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Inconsistent follow‑up</h3>
                    <p className="text-muted-foreground">Warm relationships fade without a system</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-destructive font-bold text-sm">×</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Wrong tool</h3>
                    <p className="text-muted-foreground">Traditional tools are built for inbound funnels, not relationship‑led sales</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Never miss a follow-up</h3>
                    <p className="text-muted-foreground">Smart reminders keep relationships warm</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Organized & visual</h3>
                    <p className="text-muted-foreground">Beautiful interface designed for relationship building</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Outreach made fun</h3>
                    <p className="text-muted-foreground">Gamification makes networking feel like winning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">What drives us</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These values shape every feature we build and every decision we make.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">People first</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Technology should strengthen human connections, not replace them.</p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 group-hover:from-secondary/30 group-hover:to-secondary/20 transition-colors">
                  <Target className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">Measure what matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Track the relationships and activities that truly drive your business forward.</p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 group-hover:from-primary/30 group-hover:to-secondary/20 transition-colors">
                  <Network className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Community power</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Your network is your net worth. We help you grow both.</p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20 transition-colors">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Make it joyful</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Networking should feel rewarding, not overwhelming.</p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 group-hover:from-primary/30 group-hover:to-accent/20 transition-colors">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Always evolving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">We listen to our users and continuously improve our platform.</p>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/20 md:col-span-2 lg:col-span-1 lg:mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 group-hover:from-secondary/30 group-hover:to-primary/20 transition-colors">
                  <Sparkles className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">Results that matter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Every feature is built to deliver real business outcomes.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 mb-20 text-center">
          <h2 className="text-4xl font-bold mb-6">Our mission</h2>
          <p className="text-2xl font-medium text-foreground max-w-4xl mx-auto leading-relaxed">
            Make relationship building easier, more joyful, and more effective for event professionals.
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-4">
            Because when you win more business and grow stronger brands, the entire events industry thrives.
          </p>
        </section>

        {/* Sarah's Story */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Meet the founder</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sarah M. Murphy built PinkWizard from her own experience as a business coach and entrepreneur.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Nearly a decade of business experience</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    With two business degrees and a master's from Cornell University, Sarah has coached countless small business owners through their growth challenges.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">The "aha" moment</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    After seeing business after business struggle with the same networking and follow-up challenges, Sarah realized there had to be a better way. That's when PinkWizard was born.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">Built for real relationships</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Her passion for helping businesses grow through authentic relationships is what drives every feature we build.
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative max-w-sm mx-auto lg:max-w-full">
                <img src="/lovable-uploads/2c8ee307-822b-4078-b2dd-dd920054c54c.png" alt="Sarah M. Murphy - PinkWizard Founder" className="w-full h-auto rounded-2xl shadow-xl" />
                <div className="absolute -bottom-4 -left-4 bg-background border border-border rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Relationship-first approach</p>
                      <p className="text-sm text-muted-foreground">Built by event pros, for event pros</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 p-12">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold">Ready to transform your networking?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join event professionals who've turned their networks into their most valuable business asset.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="group">
                  Start your free trial
                  <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
                  View pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>;
}