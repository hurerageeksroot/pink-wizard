import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";

export default function PrivacyPolicy() {
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
            <Shield className="h-6 w-6 text-primary" />
            <Badge variant="secondary">Legal</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At PinkWizard, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our professional networking platform.
              </p>
              <p>
                By using our service, you agree to the collection and use of information in accordance 
                with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Name and email address</li>
                  <li>Professional information and job title</li>
                  <li>Contact information you choose to store</li>
                  <li>Profile photos and avatars</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Data</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>How you interact with our platform</li>
                  <li>Features you use and time spent</li>
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Provide and maintain our networking services</li>
                <li>• Personalize your experience and recommendations</li>
                <li>• Send important updates and notifications</li>
                <li>• Improve our platform and develop new features</li>
                <li>• Ensure security and prevent fraud</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>End-to-end encryption for sensitive data</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure data centers with restricted access</li>
                <li>Employee training on data protection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You have the right to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Access your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Delete your account and data</li>
                <li>• Export your data</li>
                <li>• Opt out of marketing communications</li>
                <li>• File a complaint with supervisory authorities</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may use third-party services to provide our platform functionality:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Authentication and user management</li>
                <li>Analytics and performance monitoring</li>
                <li>Payment processing</li>
                <li>Email delivery services</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                These services have their own privacy policies and we encourage you to review them.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Email: privacy@pinkwizard.com</li>
                <li>• Address: 123 Business Ave, San Francisco, CA 94105</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}