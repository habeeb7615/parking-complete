import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface FirstLoginHandlerProps {
  children: React.ReactNode;
}

export const FirstLoginHandler = ({ children }: FirstLoginHandlerProps) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we have a profile and it's not loading
    // And we're not already on the onboarding page
    if (!loading && profile && location.pathname !== '/onboarding') {
      // Check if this is a first-time login
      if (profile.is_first_login) {
        console.log('First-time login detected, redirecting to onboarding');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [profile, loading, navigate, location.pathname]);

  // Don't render children if we're redirecting to onboarding
  if (!loading && profile?.is_first_login && location.pathname !== '/onboarding') {
    return null;
  }

  return <>{children}</>;
};
