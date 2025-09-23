import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  HelpCircle,
  Phone,
  FileText,
  Shield,
  Users,
  Target
} from "lucide-react";

const navigation = [
  { name: "Features", href: "/features" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Help", href: "/help" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    console.log('[Navbar] Attempting to sign out...');
    const { error } = await signOut();
    if (error) {
      console.error('[Navbar] Sign out error:', error);
      // Force sign out by clearing local state and redirecting anyway
      navigate("/auth");
    } else {
      console.log('[Navbar] Sign out successful');
      navigate("/");
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Sidebar Toggle + Logo */}
          <div className="flex items-center space-x-4">
            {user && (
              <SidebarTrigger className="md:flex" />
            )}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/1a800238-fd78-463f-9718-1bca6df098ea.png" 
                alt="PinkWizard Logo" 
                className="h-8"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Only show when user is authenticated */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/?tab=dashboard")}
                className="text-sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          )}

          {/* Desktop Navigation - Public Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/help")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => {
                  console.log('[Navbar] Sign In clicked');
                  navigate("/auth?tab=signin");
                }}>
                  Sign In
                </Button>
                {!isActive("/auth") && (
                  <Button onClick={() => navigate("/auth?tab=signup")}>
                    Get Started
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Logo */}
                  <img 
                    src="/lovable-uploads/1a800238-fd78-463f-9718-1bca6df098ea.png" 
                    alt="PinkWizard Logo" 
                    className="h-6"
                  />

                  {/* Mobile Navigation */}
                  <div className="flex flex-col space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          isActive(item.href)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                   {/* Mobile Auth */}
                   {user ? (
                     <div className="flex flex-col space-y-4 pt-4 border-t">
                       <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                         <User className="h-4 w-4" />
                         <span>{user.email}</span>
                       </div>
                       <Button
                         variant="ghost"
                         className="justify-start"
                         onClick={() => {
                           navigate("/?tab=dashboard");
                           setIsOpen(false);
                         }}
                       >
                         <Target className="mr-2 h-4 w-4" />
                         Dashboard
                       </Button>
                       <Button
                         variant="ghost"
                         className="justify-start"
                         onClick={() => {
                           navigate("/settings");
                           setIsOpen(false);
                         }}
                       >
                         <Settings className="mr-2 h-4 w-4" />
                         Settings
                       </Button>
                       <Button
                         variant="ghost"
                         className="justify-start"
                         onClick={() => {
                           handleSignOut();
                           setIsOpen(false);
                         }}
                       >
                         <LogOut className="mr-2 h-4 w-4" />
                         Sign Out
                       </Button>
                     </div>
                   ) : (
                     <div className="flex flex-col space-y-3 pt-4 border-t">
                         <Button
                           variant="ghost"
                           className="justify-start"
                           onClick={() => {
                             navigate("/auth?tab=signin");
                             setIsOpen(false);
                           }}
                         >
                           Sign In
                         </Button>
                        {!isActive("/auth") && (
                          <Button
                            className="justify-start"
                            onClick={() => {
                              navigate("/auth?tab=signup");
                              setIsOpen(false);
                            }}
                          >
                            Get Started
                          </Button>
                        )}
                     </div>
                   )}

                  {/* Mobile Footer Links */}
                  <div className="flex flex-col space-y-3 pt-4 border-t text-xs text-muted-foreground">
                    <Link
                      to="/privacy"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 hover:text-primary"
                    >
                      <Shield className="h-3 w-3" />
                      <span>Privacy Policy</span>
                    </Link>
                    <Link
                      to="/terms"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 hover:text-primary"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Terms of Service</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}