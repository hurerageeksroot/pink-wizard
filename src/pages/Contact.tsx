import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Clock, MessageSquare, HeadphonesIcon, Bug, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const contactData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    try {
      const { error } = await supabase.functions.invoke('send-contact', {
        body: contactData
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });

      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again or email us directly at hello@pink-wizard.com",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      value: "hello@pink-wizard.com",
      action: "mailto:hello@pink-wizard.com"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Get in Touch
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            Questions about <em>building your network?</em>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're here to help you succeed with relationship-led growth.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input id="company" name="company" />
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select name="subject" required>
                    <SelectTrigger>
                      <SelectValue placeholder="What can we help you with?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="network-strategy">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Network Cultivation Strategy
                        </div>
                      </SelectItem>
                      <SelectItem value="nonprofit">
                        <div className="flex items-center gap-2">
                          <HeadphonesIcon className="h-4 w-4" />
                          Nonprofit/Donor Management
                        </div>
                      </SelectItem>
                      <SelectItem value="support">
                        <div className="flex items-center gap-2">
                          <HeadphonesIcon className="h-4 w-4" />
                          Technical Support
                        </div>
                      </SelectItem>
                      <SelectItem value="billing">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Billing & Account
                        </div>
                      </SelectItem>
                      <SelectItem value="feature">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Feature Request
                        </div>
                      </SelectItem>
                      <SelectItem value="bug">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Bug Report
                        </div>
                      </SelectItem>
                      <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    rows={6}
                    placeholder="Tell us more about how we can help..."
                    required 
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.title} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{method.title}</h4>
                        <p className="text-sm text-muted-foreground mb-1">{method.description}</p>
                        {method.action.startsWith('#') ? (
                          <span className="text-sm font-medium text-primary">{method.value}</span>
                        ) : (
                          <a 
                            href={method.action}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {method.value}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 5:00 PM CST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Email support available 24/7 with response within 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Looking for Quick Answers?</h3>
              <p className="text-muted-foreground mb-4">
                Check our FAQ section for common questions and instant solutions.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/help'}>
                Visit FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}