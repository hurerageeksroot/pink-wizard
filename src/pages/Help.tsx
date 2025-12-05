import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Network, 
  Trophy, 
  Settings,
  HelpCircle,
  Mail,
  Phone,
  Bug
} from "lucide-react";
import { useState } from "react";
import { FeedbackDialog } from "@/components/FeedbackDialog";

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started with Network Cultivation",
    description: "Learn how to set up your network map and start building intentional relationships.",
    faqs: [
      {
        question: "How do I create my account?",
        answer: "Click 'Sign up for a free demo' and enter your email address. You'll receive a confirmation email to verify your account, then you can complete your profile setup."
      },
      {
        question: "What is the 75-Day Challenge?",
        answer: "The 75-Day Challenge is PinkWizard's gamified system to build consistent networking habits. Complete daily tasks like adding contacts, logging activities, and attending networking events to earn points and badges."
      },
      {
        question: "How do I map my network?",
        answer: "Start by adding contacts and tagging them by relationship type: past clients who could rebook, referral partners who could send leads, strategic allies for collaborations, or donors (for nonprofits). This helps PinkWizard prioritize who to reach out to."
      }
    ]
  },
  {
    icon: Users,
    title: "Managing Your Network",
    description: "Organize and track relationship health across your entire network.",
    faqs: [
      {
        question: "What contact information can I store?",
        answer: "Store name, email, company, position, phone, full address, LinkedIn URL, website, social media links (Instagram, Twitter, Facebook, TikTok), plus custom notes and source information."
      },
      {
        question: "What are relationship types?",
        answer: "Set relationships as: Past Client, Referral Partner, Strategic Ally, Lead, Donor, Friend/Family, or Booked Client. Each type has smart cadences—past clients get monthly check-ins, referral partners get quarterly touches, donors get gratitude-first communication."
      },
      {
        question: "How do I track relationship health?",
        answer: "Track progress with statuses: Cold, Warm, Hot, Won, Lost (Maybe Later), or Lost (Not a Fit). Change these as relationships develop. PinkWizard will prioritize contacts who are going cold."
      },
      {
        question: "Can I import contacts from a spreadsheet?",
        answer: "Yes! Use the Import Contacts feature to upload a CSV file. Make sure your file includes Name and Email columns at minimum."
      }
    ]
  },
  {
    icon: MessageSquare,
    title: "Network Cultivation & Follow-Up",
    description: "Best practices for nurturing past clients, referral partners, and strategic relationships.",
    faqs: [
      {
        question: "What types of activities can I log?",
        answer: "Log 6 activity types: Email, LinkedIn message, Social media interaction, Phone call, In-person meeting, or Physical mail. Track whether you received a response for each."
      },
      {
        question: "How do smart cadences work?",
        answer: "PinkWizard automatically suggests follow-up dates based on relationship type. Past clients get monthly touches, referral partners get quarterly check-ins, donors get gratitude-focused communication. Customize these in Settings."
      },
      {
        question: "How does AI outreach help with network cultivation?",
        answer: "The AI generates personalized messages for re-engaging past clients, nurturing referral partners, donor communications (nonprofits), and strategic partnership proposals. It references your contact's info and relationship history."
      },
      {
        question: "Can I use this for donor cultivation (nonprofits)?",
        answer: "Absolutely! Tag donors as a relationship type, set gratitude-first cadences, and use AI to personalize donor updates and cultivation messages at scale."
      }
    ]
  },
  {
    icon: Network,
    title: "Networking Events",
    description: "Track networking events and nurture the contacts you meet.",
    faqs: [
      {
        question: "How do I log a networking event?",
        answer: "In the Networking tab, click 'Add Event'. Enter event details like name, type, location, date, and how many contacts you met. You can also add specific contacts you connected with."
      },
      {
        question: "Can I track contacts I meet at events?",
        answer: "Yes! When logging an event, you can add specific contacts you met, include notes about your conversation, and schedule follow-ups directly from the event interface."
      },
      {
        question: "Do networking events count toward my challenge?",
        answer: "Absolutely! Networking events earn you points in the 75-Day Challenge and help complete daily tasks related to network growth and relationship building."
      }
    ]
  },
  {
    icon: Trophy,
    title: "Points & Gamification",
    description: "Understand the points system and how to build network cultivation habits.",
    faqs: [
      {
        question: "How do I earn points?",
        answer: "Earn points by adding contacts, logging activities, attending networking events, posting in the community, and completing challenge tasks. Relationship cultivation actions earn you consistent points."
      },
      {
        question: "What are badges and how do I earn them?",
        answer: "Badges are achievements for network milestones like adding your first 10 contacts, winning your first deal from a referral, or completing networking events. Each badge comes with bonus points."
      },
      {
        question: "How does the leaderboard work?",
        answer: "The leaderboard ranks users by total points earned, days completed in the challenge, and overall progress. You can opt out in your profile settings if you prefer privacy."
      },
      {
        question: "Can I see my points history?",
        answer: "Yes! Your points breakdown shows exactly how you've earned points across different network cultivation activities, with timestamps and descriptions for each point award."
      }
    ]
  },
  {
    icon: Settings,
    title: "Settings & Customization",
    description: "Configure your profile, business information, and relationship cadences.",
    faqs: [
      {
        question: "How do I update my profile?",
        answer: "Go to Settings > Profile to update your display name, company information, location, and choose whether to appear on the leaderboard."
      },
      {
        question: "What is a business profile and why do I need it?",
        answer: "Your business profile includes your business name, value proposition, industry, target market, and key differentiators. This information helps the AI generate more personalized outreach messages for network cultivation."
      },
      {
        question: "Can I customize follow-up cadences for different relationship types?",
        answer: "Yes! In Settings > Follow-up Settings, you can customize automatic follow-up intervals. Set monthly touches for past clients, quarterly for referral partners, or custom cadences for donors and strategic allies."
      }
    ]
  },
  {
    icon: HelpCircle,
    title: "Troubleshooting",
    description: "Resolve common issues and get help when needed.",
    faqs: [
      {
        question: "My CSV import isn't working",
        answer: "Ensure your CSV has 'Name' and 'Email' columns (these are required). Check for special characters, empty rows, or formatting issues. Try importing a smaller batch first."
      },
      {
        question: "I can't add or edit contacts",
        answer: "This usually means your access has expired. Check if you have an active subscription or if the 75-Day Challenge period is still active. Contact support if you believe this is an error."
      },
      {
        question: "The AI isn't generating good outreach messages",
        answer: "Make sure you've completed your business profile with detailed information about your value proposition and target market. The more context you provide, the better the AI suggestions."
      },
      {
        question: "My points or badges aren't updating",
        answer: "Points and badges update in real-time, but sometimes there may be a brief delay. Refresh the page or check back in a few minutes. Contact support if issues persist."
      }
    ]
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.map(category => ({
      ...category,
      faqs: category.faqs.filter(faq => 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
      )
    })).filter(category => 
      category.title.toLowerCase().includes(query.toLowerCase()) ||
      category.description.toLowerCase().includes(query.toLowerCase()) ||
      category.faqs.length > 0
    );

    setFilteredCategories(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Help Center</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            How can we help you <em>cultivate your network?</em>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Resources, guides, and support for building relationships that compound.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            const handleCardClick = () => {
              const element = document.getElementById(`category-${category.title.toLowerCase().replace(/\s+/g, '-')}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            return (
              <Card 
                key={category.title} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={handleCardClick}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-primary font-medium">
                      {category.faqs.length} articles
                    </p>
                    <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      View Articles →
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Quick answers to the most common questions about PinkWizard.
            </p>
          </div>

          {filteredCategories.map((category) => {
            if (category.faqs.length === 0) return null;
            
            const Icon = category.icon;
            return (
              <Card key={category.title} id={`category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.title}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Still need help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button onClick={() => window.location.href = 'mailto:hello@pink-wizard.com'}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Button>
                <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
                  <Bug className="mr-2 h-4 w-4" />
                  Report Bug
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Email us directly at <a href="mailto:hello@pink-wizard.com" className="text-primary hover:underline">hello@pink-wizard.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}