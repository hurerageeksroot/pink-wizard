import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Lock, UserPlus, LogIn, Sparkles, Users, Target, BarChart3, Zap, Calendar, MessageSquare, TrendingUp, Shield, Clock, CheckCircle, HelpCircle, KeyRound } from 'lucide-react';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  const {
    signIn,
    signUp,
    user,
    loading: authLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // Redirect authenticated users to main app or return URL
  useEffect(() => {
    if (!authLoading && user) {
      console.log('[Auth] User is authenticated, checking return URL');
      const returnUrl = searchParams.get('return');
      if (returnUrl) {
        const decodedUrl = decodeURIComponent(returnUrl);
        // Only allow relative paths starting with '/'
        if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
          console.log('[Auth] Redirecting to return URL:', decodedUrl);
          navigate(decodedUrl);
        } else {
          console.log('[Auth] Invalid return URL, redirecting to main app');
          navigate('/');
        }
      } else {
        console.log('[Auth] Redirecting to main app');
        navigate('/');
      }
    }
  }, [user, authLoading, navigate, searchParams]);

  // Debug current auth state
  useEffect(() => {
    const checkAuthState = async () => {
      const {
        data: {
          session
        },
        error
      } = await supabase.auth.getSession();
      console.log('Auth page - Current auth state:', {
        hasSession: !!session,
        user: session?.user?.email,
        error
      });
    };
    checkAuthState();
  }, []);

  // Add request tracking (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      let requestCount = 0;
      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        requestCount++;
        console.log(`Supabase Request #${requestCount}:`, args[0]);
        return originalFetch.apply(this, args);
      };
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, []);

  // Handle authentication from 75Hard app via URL parameters
  useEffect(() => {
    const handleTokenAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const userId = urlParams.get('user_id');
      const userEmail = urlParams.get('user_email');
      const isOnboarding = urlParams.get('onboarding') === 'true';
      if (accessToken && refreshToken) {
        try {
          console.log('Setting session with authentication tokens...');

          const {
            data,
            error
          } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Token authentication error:', error);
            toast({
              title: "Authentication Error",
              description: "Invalid tokens from 75Hard. Please try signing in normally.",
              variant: "destructive"
            });
          } else {
            // Check Supabase authentication
            const {
              data: {
                user
              },
              error: getUserError
            } = await supabase.auth.getUser();
            
            if (getUserError) {
              console.error('Auth error:', getUserError);
            } else {
              console.log('User authenticated from 75Hard app');
            }
            toast({
              title: "Welcome from 75Hard!",
              description: "You've been successfully authenticated."
            });

            // Auto-enroll as challenge participant for 75Hard users
            try {
              console.log('Auto-enrolling 75Hard user as challenge participant...');
              const { data: enrollResult, error: enrollError } = await supabase.functions.invoke('enroll-challenge-participant', {
                headers: {
                  Authorization: `Bearer ${data.session?.access_token}`,
                },
              });
              
              if (enrollError) {
                console.error('Challenge enrollment error:', enrollError);
              } else {
                console.log('Challenge enrollment successful:', enrollResult);
              }
            } catch (enrollError) {
              console.error('Challenge enrollment failed:', enrollError);
              // Don't show error to user as this is background enrollment
            }

            // Clean URL by removing sensitive parameters
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('access_token');
            cleanUrl.searchParams.delete('refresh_token');
            cleanUrl.searchParams.delete('user_id');
            cleanUrl.searchParams.delete('user_email');

            // Update URL without page reload
            window.history.replaceState({}, document.title, cleanUrl.toString());

            // Handle different entry points
            if (isOnboarding) {
              navigate('/?onboarding=true');
            } else {
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Authentication error:', error);
          toast({
            title: "Authentication Failed",
            description: "Unable to authenticate from 75Hard. Please sign in normally.",
            variant: "destructive"
          });
        }
      } else {
        console.log('No access/refresh tokens found in URL parameters');
      }
    };
    handleTokenAuthentication();
  }, [navigate, toast]);

  // Auto-scroll to auth form when URL has tab parameter
  useEffect(() => {
    if (searchParams.get('tab')) {
      setTimeout(() => {
        document.getElementById('auth-form')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', value);
    navigate(`/auth?${newSearchParams.toString()}`, {
      replace: true
    });
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in."
        });

        // Check for return URL parameter (only allow relative paths)
        const returnUrl = searchParams.get('return');
        if (returnUrl) {
          const decodedUrl = decodeURIComponent(returnUrl);
          // Only allow relative paths starting with '/'
          if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
            navigate(decodedUrl);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signUp(email, password, firstName, lastName);
      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Welcome to PinkWizard! Redirecting to your dashboard..."
        });

        // Dispatch welcome email event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sendWelcomeEmail', {
            detail: {
              email: email,
              userName: `${firstName} ${lastName}`.trim() || email.split('@')[0],
              userId: 'pending' // Will be set when user signs in
            }
          }));
        }, 1000);

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          const returnUrl = searchParams.get('return');
          if (returnUrl) {
            const decodedUrl = decodeURIComponent(returnUrl);
            // Only allow relative paths starting with '/'
            if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
              navigate(decodedUrl);
            } else {
              navigate('/?onboarding=true');
            }
          } else {
            navigate('/?onboarding=true');
          }
        }, 2000);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  const features = [{
    icon: Users,
    title: "Outbound Contact Management",
    description: "Track your networking contacts, event connections, and outreach prospects in one place. Never lose touch with valuable connections again."
  }, {
    icon: Target,
    title: "Follow-Up Cadence Automation",
    description: "Industry-standard follow-up sequences that keep you top-of-mind without being pushy. Built-in playbooks guide your outreach strategy."
  }, {
    icon: BarChart3,
    title: "Outreach ROI Tracking",
    description: "Measure what matters - track response rates, relationship progression, and revenue attribution from your outbound efforts."
  }, {
    icon: Calendar,
    title: "Relationship Timeline",
    description: "See your complete history with each contact. Never forget when you last reached out or what you discussed."
  }, {
    icon: MessageSquare,
    title: "Gamified Engagement",
    description: "Turn outreach into a game with points, badges, and rewards. Celebrate wins and build momentum in your networking efforts."
  }, {
    icon: TrendingUp,
    title: "Brand Visibility Boost",
    description: "Consistent outreach increases your visibility and reputation in your industry. Watch your brand recognition grow over time."
  }];
  const benefits = ["Bridge the gap between cold outreach and your traditional tools", "Turn event networking into measurable business results", "Track outbound efforts with industry-standard follow-up cadences", "Gamify relationship building to make outreach enjoyable", "Increase brand visibility and reputation in your community", "Generate higher ROI through consistent outbound activities"];
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-background px-4">
        <div className="absolute inset-0"></div>
        
        <div className="container mx-auto max-w-6xl relative py-8 pt-20">
          <div className="text-center">
            <img src="/lovable-uploads/12ec96a8-412e-4e6d-a55a-8c07b8d7d4ab.png" alt="PinkWizard" className="h-32 sm:h-40 md:max-h-48 mx-auto object-contain mb-4" style={{
            mixBlendMode: 'multiply',
            filter: 'brightness(1.1) contrast(1.1)'
          }} />
             <Badge variant="secondary" className="mt-1 mb-6 px-4 py-2 text-xs sm:text-sm">
               <Zap className="h-4 w-4 mr-2" />
               The Outbound Relationship Management System Built for Event Professionals
             </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-1 font-playfair leading-tight py-[10px]">
              Turn outreach into
              <span className="text-primary"> your unfair advantage.</span>
            </h2>
             <p className="text-xl text-muted-foreground mb-3 max-w-3xl mx-auto leading-relaxed py-[10px]">Outreach has never been this fun or this easy! PinkWizard fills the outreach gap before most traditional CRM systems start with gamified outreach that turns relationship building into your highest ROI activity. Perfect for small business owners who know outreach matters.</p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-3">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold shadow-md" onClick={() => {
              document.getElementById('auth-form')?.scrollIntoView({
                behavior: 'smooth'
              });
            }}>
                 <UserPlus className="h-5 w-5 mr-2" />
                 Start Free Trial
               </Button>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Tools That Actually Work
            </Badge>
             <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-playfair">
               Where Outbound Meets Results
             </h2>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
               Built specifically for event professionals who understand that the highest ROI comes from proactive outreach, 
               relationship nurturing, and consistent follow-up that increases visibility and deepens community connections.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-0 bg-card/80 backdrop-blur">
                 <div className="p-3 bg-primary text-primary-foreground rounded-lg w-fit mb-4">
                   <feature.icon className="h-6 w-6" />
                 </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${activeTab === 'signin' ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
            {/* Show auth form first on mobile when signin tab is active */}
            <div className={`${activeTab === 'signin' ? 'order-1 lg:order-2' : 'order-2 lg:order-2'}`} id="auth-form">
              <Card className="shadow-2xl border-0 bg-card/90 backdrop-blur">
                <CardHeader className="text-center pb-6">
                   <div className="p-3 bg-primary text-primary-foreground rounded-lg w-fit mx-auto mb-4">
                     <Sparkles className="h-6 w-6" />
                   </div>
                  <CardTitle className="text-2xl font-bold font-playfair">
                    Welcome to PinkWizard
                  </CardTitle>
                  <CardDescription className="text-base">
                    Sign in to your account or start your free trial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="signin" className="space-y-4 mt-6">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <Input id="signin-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" required />
                        </div>

                        <div className="flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" className="text-sm px-0 h-auto text-primary hover:text-primary/80">
                                <KeyRound className="h-4 w-4 mr-1" />
                                Forgot Password?
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Reset Your Password</DialogTitle>
                                <DialogDescription>
                                  Enter your email address and we'll send you a link to reset your password.
                                </DialogDescription>
                              </DialogHeader>
                              <ResetPasswordForm />
                            </DialogContent>
                          </Dialog>
                        </div>

                        <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={loading}>
                          {loading ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="space-y-4 mt-6">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="Create a password (6+ chars)" value={password} onChange={e => setPassword(e.target.value)} className="h-12" required />
                        </div>

                        <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={loading}>
                          {loading ? "Creating Account..." : "Start Free Trial"}
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          No credit card required • 14-day free trial • Cancel anytime
                        </p>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className={`${activeTab === 'signin' ? 'order-2 lg:order-1' : 'order-1 lg:order-1'}`}>
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="h-4 w-4 mr-2" />
                Real Talk
              </Badge>
                 <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-playfair">
                   Bridge the Gap Traditional Tools Can't Fill
                 </h2>
                 <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                   Most platforms excel at managing inbound leads, but they fail at outbound relationship building. PinkWizard 
                   gamifies your outreach efforts with industry-standard follow-up cadences, celebration of wins, and playbooks that work.
                 </p>
               
               <div className="space-y-4 mb-8">
                 {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                     <span className="text-foreground font-medium">{benefit}</span>
                   </div>)}
               </div>

               <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 shadow-md">
                 <Clock className="h-4 w-4 mr-2" />
                 Get Started in 60 Seconds
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 px-4 bg-gradient-to-r from-primary/10 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-playfair">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join smart business owners who've stopped losing clients to poor follow-up and started building relationships that last.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg font-semibold shadow-md">
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started Free
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            14-day free trial • No credit card required • Setup in under 2 minutes
          </p>
          <div className="mt-6">
            <Button variant="ghost" onClick={() => navigate('/help')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-4 h-4" />
              Help & Getting Started Guide
            </Button>
          </div>
        </div>
      </section>
    </div>;
};
export default Auth;