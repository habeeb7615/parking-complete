import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Shield, 
  Users, 
  Car, 
  Clock, 
  Star,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function OnboardingPage() {
  const { profile, updateProfile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    acceptTerms: false,
    enableNotifications: true
  });

  const steps = [
    { id: 1, title: 'Welcome', description: 'Get started with ParkFlow' },
    { id: 2, title: 'Security', description: 'Set up your password' },
    { id: 3, title: 'Preferences', description: 'Configure your settings' },
    { id: 4, title: 'Complete', description: 'You\'re all set!' }
  ];

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again."
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    setLoading(true);
    try {
      // Update password using NestJS API
      const { apiClient } = await import('@/lib/apiClient');
      const { AuthAPI } = await import('@/services/authApi');
      if (!user?.id) throw new Error('User not authenticated');
      
      // For first-time password setup (is_first_login: true), oldPassword is not required
      // Backend will automatically handle this based on is_first_login flag
      await apiClient.post(`/profiles/updatePassword/${user.id}`, {
        newPassword: formData.newPassword
      });

      // Refresh profile to get updated is_first_login value
      // The backend has already set is_first_login to false, so we need to refresh the profile state
      try {
        const updatedProfile = await AuthAPI.fetchProfile();
        if (updatedProfile) {
          // Update profile state - updateProfile will make a PUT request but that's okay
          // The backend will return the updated profile with is_first_login: false
          await updateProfile(updatedProfile);
          console.log('Profile refreshed after password update, is_first_login:', updatedProfile.is_first_login);
        }
      } catch (profileError) {
        console.error('Error refreshing profile:', profileError);
        // Continue even if profile refresh fails - the backend has already updated is_first_login
        // The full page reload in handleCompleteOnboarding will ensure clean state
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated."
      });

      setCurrentStep(3);
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // is_first_login is already set to false by backend when password is updated
      // Clear auth state and redirect to login so user can login with new password
      const { AuthAPI } = await import('@/services/authApi');
      
      toast({
        title: "Setup Complete!",
        description: "Your account setup is complete. Please login with your new password."
      });

      // Clear device fingerprint for attendants if needed
      if (profile?.role === 'attendant' && user) {
        try {
          const { AttendantAPI } = await import('@/services/attendantApi');
          await AttendantAPI.updateDeviceFingerprint(user.id, '');
        } catch (error) {
          console.error('Failed to clear device fingerprint:', error);
        }
      }

      // Clear token and user data from localStorage
      AuthAPI.removeToken();
      
      // Use window.location to force a full page reload and clear all state
      // This ensures FirstLoginHandler won't redirect back to onboarding
      // Small delay to ensure toast is visible
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete setup. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleFeatures = () => {
    switch (profile?.role) {
      case 'attendant':
        return [
          { icon: <Car className="h-5 w-5" />, title: 'Vehicle Check-in/out', description: 'Manage vehicle entries and exits' },
          { icon: <Clock className="h-5 w-5" />, title: 'Real-time Monitoring', description: 'Track parking status live' },
          { icon: <Shield className="h-5 w-5" />, title: 'Secure Access', description: 'Role-based permissions' }
        ];
      case 'contractor':
        return [
          { icon: <Users className="h-5 w-5" />, title: 'Team Management', description: 'Manage your attendants and locations' },
          { icon: <Car className="h-5 w-5" />, title: 'Location Overview', description: 'Monitor all your parking locations' },
          { icon: <Star className="h-5 w-5" />, title: 'Analytics', description: 'Track performance and revenue' }
        ];
      case 'super_admin':
        return [
          { icon: <Users className="h-5 w-5" />, title: 'User Management', description: 'Manage all users and permissions' },
          { icon: <Shield className="h-5 w-5" />, title: 'System Control', description: 'Full system administration' },
          { icon: <Star className="h-5 w-5" />, title: 'Analytics', description: 'Comprehensive system insights' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    ${currentStep >= step.id 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-white/20 text-white/60'
                    }
                  `}>
                    {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/20'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-white">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-white/80">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Welcome to ParkFlow, {profile?.user_name}!
                    </h3>
                    <p className="text-white/80 text-lg">
                      You're now a <Badge variant="secondary" className="ml-2">
                        {profile?.role?.toUpperCase()}
                      </Badge>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {getRoleFeatures().map((feature, index) => (
                      <div key={index} className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-purple-400 mb-2 flex justify-center">
                          {feature.icon}
                        </div>
                        <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                        <p className="text-white/70 text-sm">{feature.description}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => setCurrentStep(2)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Set Up Your Password
                    </h3>
                    <p className="text-white/80">
                      For security, please set a strong password for your account.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-white font-medium">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:bg-white/10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-white font-medium">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                        placeholder="Confirm your new password"
                      />
                    </div>

                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                      <h4 className="text-blue-200 font-semibold mb-2">Password Requirements:</h4>
                      <ul className="text-blue-100 text-sm space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Mix of letters, numbers, and symbols</li>
                        <li>• Avoid common words or personal info</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => setCurrentStep(1)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={loading || !formData.newPassword || !formData.confirmPassword}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Configure Your Preferences
                    </h3>
                    <p className="text-white/80">
                      Set up your account preferences for the best experience.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label htmlFor="acceptTerms" className="text-white/80">
                        I accept the Terms of Service and Privacy Policy
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="enableNotifications"
                        checked={formData.enableNotifications}
                        onCheckedChange={(checked) => setFormData({...formData, enableNotifications: checked as boolean})}
                        className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label htmlFor="enableNotifications" className="text-white/80">
                        Enable notifications for important updates
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => setCurrentStep(2)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(4)}
                      disabled={!formData.acceptTerms}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Setup Complete!
                    </h3>
                    <p className="text-white/80 text-lg">
                      Your account is ready. Welcome to ParkFlow!
                    </p>
                  </div>

                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                    <h4 className="text-green-200 font-semibold mb-2">What's Next?</h4>
                    <ul className="text-green-100 text-sm space-y-1">
                      <li>• Explore your personalized dashboard</li>
                      <li>• Complete your profile information</li>
                      <li>• Start using ParkFlow features</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl"
                  >
                    {loading ? 'Completing...' : 'Go to Dashboard'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
