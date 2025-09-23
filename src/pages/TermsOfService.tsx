import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users, Shield, AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <Badge variant="secondary">Legal</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                By accessing and using PinkWizard, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>
              <p>
                These Terms of Service ("Terms") govern your use of our website and services 
                operated by PinkWizard ("us", "we", or "our").
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                PinkWizard is a professional networking platform that helps users:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Manage professional contacts and relationships</li>
                <li>Track networking activities and outcomes</li>
                <li>Generate AI-powered outreach messages</li>
                <li>Monitor networking ROI and analytics</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Account Creation</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>One account per person or business entity</li>
                  <li>Must be 18+ years old to create an account</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Account Responsibilities</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of unauthorized access</li>
                  <li>Use the service in compliance with applicable laws</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You agree not to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Use the service for any illegal or unauthorized purpose</li>
                <li>• Spam, harass, or abuse other users</li>
                <li>• Upload malicious code or attempt to hack the system</li>
                <li>• Violate any laws in your jurisdiction</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Scrape or harvest user data without permission</li>
                <li>• Create multiple accounts to circumvent restrictions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Billing and Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Billing and Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Subscription Plans</h4>
                <p className="text-muted-foreground mb-2">
                  Paid plans are billed in advance on a monthly or annual basis.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Refunds</h4>
                <p className="text-muted-foreground">
                  Refunds are provided at our discretion. Contact support for refund requests.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Price Changes</h4>
                <p className="text-muted-foreground">
                  We may change subscription prices with 30 days advance notice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Our Rights</h4>
                <p className="text-muted-foreground">
                  PinkWizard and its original content, features, and functionality are owned by us 
                  and are protected by copyright, trademark, and other laws.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Your Content</h4>
                <p className="text-muted-foreground">
                  You retain ownership of content you submit. By using our service, you grant us 
                  a license to use, store, and process your content to provide the service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                In no event shall PinkWizard be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use of the service.
              </p>
              <p className="text-muted-foreground">
                Our total liability to you for all claims shall not exceed the amount you paid 
                us in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">By You</h4>
                <p className="text-muted-foreground">
                  You may terminate your account at any time through your account settings.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">By Us</h4>
                <p className="text-muted-foreground">
                  We may terminate accounts that violate these terms or for any reason with notice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. We will notify users of 
                material changes via email or through the platform.
              </p>
              <p className="text-muted-foreground">
                Continued use of the service after changes constitutes acceptance of new terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Questions about these Terms of Service? Contact us:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Email: legal@pinkwizard.com</li>
                <li>• Address: 123 Business Ave, San Francisco, CA 94105</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}