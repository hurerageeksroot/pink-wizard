import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, MapPin, Heart } from "lucide-react";
const footerLinks = {
  product: [{
    name: "Features",
    href: "/features"
  }, {
    name: "Pricing",
    href: "/pricing"
  }, {
    name: "Help Center",
    href: "/help"
  }, {
    name: "Contact",
    href: "/contact"
  }],
  company: [{
    name: "About",
    href: "/about"
  }, {
    name: "Privacy Policy",
    href: "/privacy"
  }, {
    name: "Terms of Service",
    href: "/terms"
  }],
  resources: [{
    name: "Help & Support",
    href: "/help"
  }, {
    name: "Contact Us",
    href: "/contact"
  }]
};
export function Footer() {
  return <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/lovable-uploads/1a800238-fd78-463f-9718-1bca6df098ea.png" alt="PinkWizard Logo" className="h-8" />
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">PinkWizard helps you turn outreach and connections into predictable revenue, all while making the process feel confident and rewarding.</p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hello@pink-wizard.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Nashville, TN</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PinkWizard. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>by the PinkWizard team</span>
          </div>
        </div>
      </div>
    </footer>;
}