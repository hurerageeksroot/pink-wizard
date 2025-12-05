import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Shield, KeyRound, ArrowLeft, Users, Award } from 'lucide-react';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
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
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-waitlist', {
        body: {
          email,
          first_name: firstName,
          last_name: lastName,
          company: company || null,
          position: position || null,
          referral_source: referralSource || null
        }
      });

      if (error) throw error;

      if (data.success) {
        setWaitlistSuccess(true);
        setWaitlistPosition(data.position);
        toast({
          title: "You're on the waitlist!",
          description: `Thanks for your interest! You're #${data.position} in line.`
        });
        
        // Clear form
        setEmail('');
        setFirstName('');
        setLastName('');
        setCompany('');
        setPosition('');
        setReferralSource('');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  return <div className="min-h-screen flex w-full">
      {/* Left Side - Brand & Value Proposition */}
      <div 
        className="hidden lg:flex lg:w-2/5 p-12 flex-col justify-between"
        style={{ 
          background: 'linear-gradient(135deg, #078e92, #cc116c)' 
        }}
      >
        {/* Logo */}
        <div>
          <h2 className="text-white text-2xl font-playfair font-bold">PinkWizard</h2>
        </div>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Build the Network That
            <span className="block italic text-brand-lime mt-2">Builds Your Future</span>
          </h1>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              The relationship-first CRM that turns outreach into measurable results for both life and business. Track contacts, nurture relationships, and watch the rewards rack up (both in points and relationships!).
            </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Secure & private</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>Brain-friendly incentivization</span>
            </div>
          </div>
        </div>

        {/* Bottom space */}
        <div className="pt-6">
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/lovable-uploads/12ec96a8-412e-4e6d-a55a-8c07b8d7d4ab.png" 
              alt="PinkWizard" 
              className="h-16 mx-auto mb-4"
              style={{
                mixBlendMode: 'multiply',
                filter: 'brightness(1.1) contrast(1.1)'
              }}
            />
            <p className="text-sm text-muted-foreground">
              The relationship-first CRM for event professionals
            </p>
          </div>

          {/* Back to Website Link */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
          </div>

          {/* Auth Form */}
          <div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup">
                  Join Waitlist
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-playfair mb-2">Welcome back</h2>
                  <p className="text-muted-foreground">
                    Sign in to your account to continue
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input 
                      id="signin-password" 
                      type="password" 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                      required 
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-sm px-0 h-auto">
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

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold"
                    onClick={() => handleTabChange('signup')}
                  >
                    Join the waitlist
                  </Button>
                </p>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-6">
                {waitlistSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg w-fit mx-auto mb-4">
                      <CheckCircle className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-bold font-playfair">You're on the waitlist!</h3>
                    <p className="text-muted-foreground">
                      Thanks for your interest! You're #{waitlistPosition} in line.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll email you when it's your turn to join PinkWizard.
                    </p>
                    <Button 
                      onClick={() => {
                        setWaitlistSuccess(false);
                        setWaitlistPosition(null);
                      }}
                      variant="outline"
                    >
                      Join Another Email
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold font-playfair mb-2">Join the waitlist</h2>
                      <p className="text-muted-foreground">
                        Be among the first to experience PinkWizard
                      </p>
                    </div>
                    <form onSubmit={handleJoinWaitlist} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input 
                            id="firstName" 
                            type="text" 
                            placeholder="First name" 
                            value={firstName} 
                            onChange={e => setFirstName(e.target.value)} 
                            className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input 
                            id="lastName" 
                            type="text" 
                            placeholder="Last name" 
                            value={lastName} 
                            onChange={e => setLastName(e.target.value)} 
                            className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email *</Label>
                        <Input 
                          id="signup-email" 
                          type="email" 
                          placeholder="your.email@example.com" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company (Optional)</Label>
                        <Input 
                          id="company" 
                          type="text" 
                          placeholder="Company name" 
                          value={company} 
                          onChange={e => setCompany(e.target.value)} 
                          className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position (Optional)</Label>
                        <Input 
                          id="position" 
                          type="text" 
                          placeholder="Your role" 
                          value={position} 
                          onChange={e => setPosition(e.target.value)} 
                          className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referralSource">How did you hear about us? (Optional)</Label>
                        <Input 
                          id="referralSource" 
                          type="text" 
                          placeholder="e.g., LinkedIn, friend, event" 
                          value={referralSource} 
                          onChange={e => setReferralSource(e.target.value)} 
                          className="h-12 border-2 border-gray-300 focus:border-brand-teal-dark" 
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={loading}>
                        {loading ? "Joining..." : "Join Waitlist"}
                      </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-semibold"
                        onClick={() => handleTabChange('signin')}
                      >
                        Log in
                      </Button>
                    </p>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;