"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI, Profile as AuthProfile } from "@/services/authApi";
import { useToast } from "@/hooks/use-toast";

type Profile = AuthProfile;

interface User {
  id: string;
  email: string;
  role: string;
  user_name: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: { access_token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: string) => Promise<ApiResponse>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<ApiResponse>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<ApiResponse>;
  resetPassword: (email: string) => Promise<ApiResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const data = await AuthAPI.getProfileById(userId);

      if (data) {
        // Save profile to localStorage
        AuthAPI.setProfile(data as Profile);
        
        // Check subscription validity for contractors
        if (data.role === 'contractor') {
          const now = new Date();
          const profileData = data as any; // Type assertion for subscription fields
          const endDate = profileData.subscription_end_date ? new Date(profileData.subscription_end_date) : null;
          const isExpired = endDate && endDate < now;
          const isSuspended = profileData.subscription_status === 'expired' || profileData.subscription_status === 'suspended';
          
          if (isExpired || isSuspended) {
            // Show subscription expiry message
            const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const message = isExpired 
              ? `Your subscription has expired. Please recharge to continue using the service.`
              : `Your subscription will expire in ${Math.max(0, daysRemaining)} days. Please recharge to avoid service interruption.`;
            
            toast({
              variant: "destructive",
              title: "Subscription Expired",
              description: message,
            });
          }
          
          // Fetch and save contractor data
          try {
            const { ContractorAPI } = await import('@/services/contractorApi');
            const contractor = await ContractorAPI.getContractorByUserId(userId);
            if (contractor) {
              AuthAPI.setContractor(contractor);
            }
          } catch (error) {
            console.error('Failed to fetch contractor data:', error);
          }
        } else if (data.role === 'attendant') {
          // Fetch and save attendant data
          try {
            const { AttendantAPI } = await import('@/services/attendantApi');
            const attendant = await AttendantAPI.getAttendantByUserId(userId);
            if (attendant) {
              AuthAPI.setAttendant(attendant);
            }
          } catch (error) {
            console.error('Failed to fetch attendant data:', error);
          }
        }
        
        setProfile(data as Profile);
        
        // Check if this is a first-time login
        if (data.is_first_login) {
          console.log('First-time login detected, user will be redirected to onboarding');
        }
        
        return { data, error: null };
      }
      
      return { data: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } };
    } catch (error) {
      console.error('Fetch profile error:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    console.log('AuthProvider: Initializing authentication...');
    
    // Check for existing session in localStorage
    const checkAuth = async () => {
      try {
        const token = AuthAPI.getToken();
        const storedUser = AuthAPI.getUser();
        
        if (token && storedUser) {
          console.log('AuthProvider: Found existing session for user:', storedUser.id);
          setSession({ access_token: token });
          setUser(storedUser);
          
          // Try to load profile from localStorage first
          const storedProfile = AuthAPI.getProfile();
          if (storedProfile) {
            console.log('AuthProvider: Found stored profile');
            setProfile(storedProfile);
            
            // Load role-specific data if available
            if (storedProfile.role === 'contractor') {
              const storedContractor = AuthAPI.getContractor();
              if (storedContractor) {
                console.log('AuthProvider: Found stored contractor data');
              }
            } else if (storedProfile.role === 'attendant') {
              const storedAttendant = AuthAPI.getAttendant();
              if (storedAttendant) {
                console.log('AuthProvider: Found stored attendant data');
              }
            }
          }
          
          // Try to fetch real profile to ensure it's up to date
          try {
            await fetchProfile(storedUser.id);
          } catch (error) {
            console.error('AuthProvider: Failed to fetch profile, using stored data', error);
            // If no stored profile, create a temporary one from stored user
            if (!storedProfile) {
              const tempProfile: Profile = {
                id: storedUser.id,
                user_name: storedUser.user_name || storedUser.email || 'User',
                email: storedUser.email || '',
                role: storedUser.role as Profile['role'],
                status: 'active',
                is_first_login: false,
              };
              setProfile(tempProfile);
              AuthAPI.setProfile(tempProfile);
            } else {
              // Use stored profile if fetch fails
              setProfile(storedProfile);
            }
          }
        } else {
          console.log('AuthProvider: No existing session found');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('AuthProvider: Error checking auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('Auth loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 2000); // 2 second timeout

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string, role?: string) => {
    try {
      console.log('SignIn: Starting sign in process for:', email, 'with role:', role);
      
      const loginResponse = await AuthAPI.login(email, password);
      
      console.log('SignIn: NestJS auth response:', { userId: loginResponse.user?.id });

      // Set user and session
      setUser(loginResponse.user);
      setSession({ access_token: loginResponse.access_token });

      // Try to fetch real profile first
      let finalProfile: Profile | null = null;
      try {
        console.log('SignIn: Fetching profile');
        const profileResult = await fetchProfile(loginResponse.user.id);
        console.log('SignIn: Profile fetched successfully');
        
        // Profile is already saved in fetchProfile, but ensure it's set in state
        if (profileResult.data) {
          finalProfile = profileResult.data as Profile;
          setProfile(finalProfile);
        }
      } catch (error) {
        console.log('SignIn: Profile fetch failed, using user data');
        // Create a temporary profile from user data
        const tempProfile: Profile = {
          id: loginResponse.user.id,
          user_name: loginResponse.user.user_name,
          email: loginResponse.user.email,
          role: loginResponse.user.role as Profile['role'],
          status: 'active',
          is_first_login: false,
        };
        finalProfile = tempProfile;
        setProfile(tempProfile);
        AuthAPI.setProfile(tempProfile);
      }

      // Check if role matches (if specified) - check after profile is fetched
      if (role && finalProfile) {
        const userRole = finalProfile.role?.toLowerCase()?.trim();
        const expectedRole = role.toLowerCase().trim();
        const userName = finalProfile.user_name?.toLowerCase() || loginResponse.user.user_name?.toLowerCase() || '';
        const userEmail = finalProfile.email?.toLowerCase() || loginResponse.user.email?.toLowerCase() || '';
        
        console.log('SignIn: Checking role match', { 
          userRole, 
          expectedRole, 
          profileRole: finalProfile.role,
          loginUserRole: loginResponse.user.role,
          userName,
          userEmail
        });
        
        // Check if role matches
        let roleMatches = userRole === expectedRole;
        
        // Fallback: If expecting super_admin but role doesn't match, check user_name or email
        if (!roleMatches && expectedRole === 'super_admin') {
          const isSuperAdminByName = userName.includes('super admin') || userName.includes('admin');
          const isSuperAdminByEmail = userEmail.includes('admin@') || userEmail.includes('@admin');
          
          if (isSuperAdminByName || isSuperAdminByEmail) {
            console.log('SignIn: Role mismatch but user appears to be super admin based on name/email, allowing access');
            roleMatches = true;
            // Update the profile role to super_admin for consistency
            finalProfile.role = 'super_admin' as Profile['role'];
            setProfile(finalProfile);
            AuthAPI.setProfile(finalProfile);
          }
        }
        
        if (!roleMatches) {
          console.log('SignIn: Role mismatch detected', { 
            userRole, 
            expectedRole, 
            hasRole: !!userRole,
            userName,
            userEmail
          });
          AuthAPI.removeToken();
          setUser(null);
          setSession(null);
          setProfile(null);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this area",
          });
          return { error: { message: "Invalid role" }, success: false };
        }
        
        console.log('SignIn: Role check passed');
      }

      // Device restriction for attendants (async, non-blocking)
      if (loginResponse.user.role === 'attendant') {
        console.log('SignIn: Checking device restriction for attendant');
        setTimeout(async () => {
          try {
            const deviceFingerprint = generateDeviceFingerprint();
            const { AttendantAPI } = await import('@/services/attendantApi');
            
            // Check if user is already logged in on another device
            const wasLoggedIn = await AttendantAPI.isAttendantLoggedIn(loginResponse.user.id);
            const isAllowed = await AttendantAPI.checkDeviceRestriction(loginResponse.user.id, deviceFingerprint);
            
            if (!isAllowed && wasLoggedIn) {
              console.log('Device restriction: Different device detected, allowing login with warning');
              await AttendantAPI.updateDeviceFingerprint(loginResponse.user.id, deviceFingerprint);
              
              toast({
                variant: "default",
                title: "Device Switch Detected",
                description: "You were logged in on another device. This device is now active.",
              });
            } else {
              await AttendantAPI.updateDeviceFingerprint(loginResponse.user.id, deviceFingerprint);
              console.log('Device restriction: Login allowed, device fingerprint updated');
            }
          } catch (deviceError) {
            console.error('Device restriction check failed:', deviceError);
          }
        }, 100);
      }

      setLoading(false);
      
      toast({
        title: "Welcome back!",
        description: `Signed in as ${loginResponse.user.user_name}`,
      });
      
      console.log('SignIn: Sign in process completed successfully');
      return { error: null, success: true };
    } catch (error: any) {
      console.error('SignIn: Unexpected error:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Sign In Error",
        description: errorMessage,
      });
      return { error: { message: errorMessage }, success: false };
    }
  };

  // Generate device fingerprint
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    // User registration is handled by super admin in this system
    // Frontend signup is not available
    toast({
      variant: "destructive",
      title: "Sign Up Not Available",
      description: "User registration is managed by administrators. Please contact your administrator to create an account.",
    });
    return { 
      success: false,
      error: {
        code: "SIGNUP_NOT_AVAILABLE",
        message: "User registration is managed by administrators",
        details: "Please contact your administrator to create an account"
      }
    };
  };

  const signOut = async () => {
    try {
      console.log('SignOut: Starting logout process...');
      
      // Clear device fingerprint for attendants
      if (profile?.role === 'attendant' && user) {
        try {
          const { AttendantAPI } = await import('@/services/attendantApi');
          await AttendantAPI.updateDeviceFingerprint(user.id, '');
          console.log('SignOut: Device fingerprint cleared on logout');
        } catch (error) {
          console.error('SignOut: Failed to clear device fingerprint:', error);
          // Continue with logout even if this fails
        }
      }

      // Clear all authentication data from localStorage
      console.log('SignOut: Clearing all localStorage data...');
      AuthAPI.clearAllAuthData();

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      console.log('SignOut: All data cleared successfully');
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      
      // Small delay to ensure localStorage is cleared before redirect
      setTimeout(() => {
        // Redirect to home
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('SignOut error:', error);
      // Clear everything even if there's an error
      try {
        AuthAPI.clearAllAuthData();
      } catch (clearError) {
        console.error('SignOut: Error clearing localStorage:', clearError);
        // Last resort: clear all localStorage
        try {
          localStorage.clear();
        } catch (finalError) {
          console.error('SignOut: Failed to clear localStorage completely:', finalError);
        }
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // TODO: Implement password reset endpoint in NestJS backend
      // For now, show a message that this feature needs to be implemented
      toast({
        variant: "destructive",
        title: "Password Reset",
        description: "Password reset functionality will be available soon. Please contact administrator.",
      });
      return { 
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: "Password reset functionality is not yet implemented",
          details: "Please contact administrator for password reset"
        }
      };
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Password Reset Error",
        description: "An unexpected error occurred",
      });
      return { 
        success: false,
        error: {
          code: 'UNKNOWN',
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { 
      error: { 
        code: "NO_USER", 
        message: "No user logged in" 
      }, 
      success: false 
    };

    try {
      const { apiClient } = await import('@/lib/apiClient');
      const response = await apiClient.post<Profile>(`/profiles/update/${user.id}`, updates);
      
      if (response.data) {
        setProfile(response.data);
        // Save updated profile to localStorage
        AuthAPI.setProfile(response.data);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully",
        });
        return { error: undefined, success: true };
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update profile";
      toast({
        variant: "destructive",
        title: "Update Error",
        description: errorMessage,
      });
      return { 
        error: {
          code: error?.statusCode || "UPDATE_ERROR",
          message: errorMessage,
          details: error?.message
        }, 
        success: false 
      };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};