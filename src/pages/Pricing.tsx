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
  description: "Everything you need to cultivate your network—0 AI tokens included",
  monthlyPrice: 9,
  yearlyPrice: 90, // 2 months free
  features: [
    "Unlimited contacts—track your entire network",
    "Relationship-first organization (past clients, referral partners, strategic allies)",
    "Smart follow-up cadences that match each relationship type",
    "Activity tracking across all channels",
    "Revenue & referral tracking—see your network ROI",
    "Daily prioritization—know who to reach out to and why",
    "Streak tracking & motivation",
    "Community access",
    "Email support",
    "Free trial available",
    "0 AI tokens included (purchase separately)",
  ],
  buttonText: "Get Started",
  buttonVariant: "default" as const,
};

const tokenPacks = [
  {
    name: "Starter Pack",
    icon: Zap,
    description: "Perfect for re-engaging past clients",
    tokens: "50K",
    price: 9.99,
    features: [
      "50,000 AI tokens",
      "~33 outreach messages",
      "365-day carryover",
      "Re-engage past clients who've gone quiet",
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
    description: "Best value for active network builders",
    tokens: "300K",
    price: 49.99,
    features: [
      "300,000 AI tokens",
      "~200 outreach messages",
      "365-day carryover",
      "Nurture referral partners at scale",
      "Personalize donor communications (nonprofits)",
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
    description: "For comprehensive network cultivation",
    tokens: "1.5M",
    price: 199.99,
    features: [
      "1,500,000 AI tokens",
      "~1,000 outreach messages",
      "365-day carryover",
      "Strategic partnership proposals at scale",
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
            Simple Pricing for <em>Relationship-Led Growth</em>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Invest in your network, not bloated software. One base plan for relationship cultivation, plus AI tokens when you need message help.
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
              Add AI assistance for <em>personalized</em> outreach at scale—break through the "I don't know what to say" barrier
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
              <h3 className="font-semibold mb-2">Is this just for sales?</h3>
              <p className="text-muted-foreground text-sm">
                No! PinkWizard is for anyone whose success depends on relationships: consultants, nonprofits, community organizers, event pros, small businesses, personal brands, and more.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">I already have a CRM. Why do I need this?</h3>
              <p className="text-muted-foreground text-sm">
                Traditional CRMs manage inbound leads. PinkWizard helps you intentionally cultivate your network—past clients, referral partners, strategic allies, and future opportunities. Different tool, different purpose.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How is this different from LinkedIn?</h3>
              <p className="text-muted-foreground text-sm">
                LinkedIn is a directory. PinkWizard is a system. It tells you who to reach out to, when, and why—and helps you track which relationships actually drive business outcomes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can nonprofits use this for donor management?</h3>
              <p className="text-muted-foreground text-sm">
                Absolutely! Many of our users are nonprofit professionals who use PinkWizard to track donor cultivation (not just donation asks), volunteer relationships, and community partnerships.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do AI tokens work?</h3>
              <p className="text-muted-foreground text-sm">
                Each AI outreach message uses approximately 1,500 tokens. All token packs have 365-day carryover.
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
          <h2 className="text-2xl font-bold mb-4">Your Network is Your Biggest Asset. <em>Start Investing in It Today.</em></h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            For $9/month, get the system that helps you turn contacts into relationships, and relationships into compounding opportunities.
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