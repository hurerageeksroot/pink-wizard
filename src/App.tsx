import { FC, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionBridge } from "@/components/SessionBridge";
import { ExternalCountsBridge } from "@/components/ExternalCountsBridge";
import { EmailNotificationHandler } from "@/components/EmailNotificationHandler";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import EnhancedErrorBoundary from "@/components/EnhancedErrorBoundary";
import { GlobalDataProvider } from "@/components/GlobalDataProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppHealthMonitor } from "@/components/AppHealthMonitor";

// Lazy load all pages for better performance
// Direct import for Index to avoid lazy loading issues
import Index from "./pages/Index";
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIOutreach = lazy(() => import("./pages/AIOutreach"));
const Help = lazy(() => import("./pages/Help"));
// Direct import for AdminRoutes to avoid lazy loading issues
import AdminRoutes from "./pages/AdminRoutes";
const Settings = lazy(() => import("./pages/Settings"));
const Resources = lazy(() => import("./pages/Resources"));
const ResourceArticle = lazy(() => import("./pages/ResourceArticle"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Features = lazy(() => import("./pages/Features"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - much longer cache
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection  
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1, // Reduce retries for failed requests
      refetchInterval: false, // Disable automatic background refetch
    },
  },
});

const AppContent: FC = () => {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        {user && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          {user && (
            <div className="md:hidden sticky top-0 z-40 bg-background border-b px-4 py-2 flex items-center justify-between">
              <SidebarTrigger className="p-2" />
              <h1 className="text-lg font-semibold">CRM Dashboard</h1>
            </div>
          )}
          <Navbar />
          <main className="flex-1 route-transition">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/ai-outreach" element={
                  <ProtectedRoute>
                    <AIOutreach />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/help" element={<Help />} />
                <Route path="/admin/*" element={
                  <ProtectedRoute>
                    <AdminRoutes />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminRoutes />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/resources" element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                } />
                <Route path="/resources/:id" element={
                  <ProtectedRoute>
                    <ResourceArticle />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

const App: FC = () => {
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <AppHealthMonitor />
        <AuthProvider>
          <GlobalDataProvider>
            <SessionBridge />
            <ExternalCountsBridge />
            <EmailNotificationHandler />
            <AppContent />
          </GlobalDataProvider>
        </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
};

export default App;