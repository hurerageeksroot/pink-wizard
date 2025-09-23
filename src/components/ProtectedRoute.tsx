import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showRedirect, setShowRedirect] = useState(false);

  // Grace period before redirecting to prevent flicker
  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => setShowRedirect(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowRedirect(false);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && showRedirect) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?return=${returnTo}`} replace />;
  }

  return <>{children}</>;
}