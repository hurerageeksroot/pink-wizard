import { useState } from "react";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useAIQuota } from "@/hooks/useAIQuota";
import { useNavigate } from "react-router-dom";

const basePlan = {
  name: "Professional Plan",
  icon: Crown,
  description: "Contact management system with outreach tracking - 0 AI tokens included",
  monthlyPrice: 9,
  yearlyPrice: 90, // 2 months free
  features: [
    "Contact management & organization",
    "Task management & tracking", 
    "Outreach tracking & analytics",
    "Revenue & deal tracking",
    "Community access",
    "Email support",
    "Free trial available",
    "0 AI tokens included",
  ],
  buttonText: "Get Started",
  buttonVariant: "default" as const,
};

const tokenPacks = [
  {
    name: "Starter Pack",
    icon: Zap,
    description: "Perfect for getting started",
    tokens: "50K",
    price: 9.99,
    features: [
      "50,000 AI tokens",
      "~33 outreach messages",
      "365-day carryover",
      "Generate outreach messages",
    ],
    popular: false,
    buttonText: "Buy Tokens",
    buttonVariant: "outline" as const,
    packType: "starter" as const,
    costPerMessage: 0.30,
    savings: null,
  },
  {
    name: "Growth Pack",
    icon: Rocket,
    description: "Best value for active networkers",
    tokens: "300K",
    price: 49.99,
    features: [
      "300,000 AI tokens",
      "~200 outreach messages",
      "365-day carryover",
      "Generate outreach messages",
    ],
    popular: true,
    buttonText: "Buy Tokens",
    buttonVariant: "default" as const,
    packType: "growth" as const,
    costPerMessage: 0.25,
    savings: "Save $0.05 per message",
  },
  {
    name: "Enterprise Pack",
    icon: Crown,
    description: "For high-volume outreach",
    tokens: "1.5M",
    price: 199.99,
    features: [
      "1,500,000 AI tokens",
      "~1,000 outreach messages",
      "365-day carryover",
      "Generate outreach messages",
      "Team member invites (coming soon)",
    ],
    popular: false,
    buttonText: "Buy Tokens",
    buttonVariant: "outline" as const,
    packType: "enterprise" as const,
    costPerMessage: 0.20,
    savings: "Save $0.10 per message",
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const { createCheckout } = useAccess();
  const { buyTokens } = useAIQuota();
  const navigate = useNavigate();

  const handlePlanSelect = async (type: 'base' | 'tokens', item?: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (type === 'base') {
      // Handle base subscription
      try {
        const checkoutUrl = await createCheckout();
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
        }
      } catch (error) {
        console.error("Error creating checkout:", error);
      }
    } else if (type === 'tokens' && item) {
      // Handle token pack purchase
      console.log(`Purchasing ${item.name} for $${item.price}`);
      // TODO: Implement token pack purchase logic
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Simple Pricing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            One simple base plan. Add AI tokens when you need message help.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start small, scale outreach as you grow—no bloated bundles or confusing tiers.
          </p>
          <div className="mt-6">
            <Button variant="link" onClick={() => navigate("/features")} className="text-primary">
              Explore full features →
            </Button>
          </div>
        </div>

        {/* Base Plan */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Base Subscription</h2>
            <p className="text-muted-foreground">
              Get access to all core features with our affordable monthly plan
            </p>
          </div>
          
          <Card className="border-primary shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">{basePlan.name}</CardTitle>
              <CardDescription className="text-lg">{basePlan.description}</CardDescription>
              
              <div className="mt-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    Monthly
                  </span>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    Yearly
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    Save 17%
                  </Badge>
                </div>
                
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold">${isYearly ? Math.round(basePlan.yearlyPrice / 12) : basePlan.monthlyPrice}</span>
                  <span className="text-muted-foreground text-xl">/month</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Billed annually (${basePlan.yearlyPrice}/year)
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {basePlan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-center">
                  <strong>Note:</strong> Base plan includes 0 AI tokens • Purchase AI tokens separately
                </p>
              </div>

              <Button 
                className="w-full" 
                variant={basePlan.buttonVariant}
                size="lg"
                onClick={() => handlePlanSelect('base')}
              >
                {basePlan.buttonText}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Token Packs */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">AI Token Packs</h2>
            <p className="text-muted-foreground">
              Purchase AI credits for personalized outreach campaigns as you need them
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tokenPacks.map((pack) => {
              const Icon = pack.icon;
              
              return (
                <Card 
                  key={pack.name}
                  className={`relative ${pack.popular ? 'border-primary shadow-lg scale-105' : ''} hover:shadow-lg transition-all duration-300`}
                >
                  {pack.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Best Value
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-3xl font-bold">${pack.price}</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {pack.tokens} tokens
                        </Badge>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            ${pack.costPerMessage}/message
                          </p>
                          {pack.savings && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              {pack.savings}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {pack.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full" 
                      variant={pack.buttonVariant}
                      size="lg"
                      onClick={() => buyTokens(pack.packType)}
                    >
                      {pack.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">How do AI tokens work?</h3>
              <p className="text-muted-foreground text-sm">
                Each AI outreach message uses approximately 1,500 tokens. All token packs have 365-day carryover.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can cancel anytime. You'll keep access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do unused tokens rollover?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, all token packs have 365-day validity and unused tokens rollover.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! Start with a 14-day free trial of the base plan. AI tokens purchased separately.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 border border-primary/20">
          <h2 className="text-2xl font-bold mb-4">Ready to transform your networking?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start with just $9/month and scale your AI outreach as your business grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(user ? "/" : "/auth")} className="bg-primary">
              {user ? "Upgrade Now" : "Start 14-Day Free Trial"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.open("mailto:hello@pinkwizard.com", "_blank")}>
              Questions? Contact Us
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14‑day free trial • No credit card • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}