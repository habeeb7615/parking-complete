import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MobileRouterProps {
  children: React.ReactNode;
}

export function MobileRouter({ children }: MobileRouterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Handle mobile browser refresh issues
    const handleMobileRefresh = () => {
      // If user is authenticated and on a dashboard route
      if (user && profile && location.pathname.startsWith('/dashboard')) {
        console.log('MobileRouter: User authenticated, allowing dashboard access');
        return;
      }
      
      // If user is not authenticated but trying to access dashboard
      if (!user && location.pathname.startsWith('/dashboard')) {
        console.log('MobileRouter: User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      
      // If user is on a deep route that doesn't exist, redirect to dashboard
      // But allow onboarding route for first-time login
      if (user && profile && location.pathname !== '/' && 
          !location.pathname.startsWith('/dashboard') && 
          !location.pathname.startsWith('/login') && 
          !location.pathname.startsWith('/onboarding')) {
        console.log('MobileRouter: Invalid route, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }
    };

    // Only run after loading is complete
    if (!loading) {
      handleMobileRefresh();
    }
  }, [location.pathname, user, profile, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  return <>{children}</>;
}
