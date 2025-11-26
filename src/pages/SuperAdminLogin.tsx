import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useEffect } from "react";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('SuperAdminLogin: useEffect triggered', { user: !!user, profile: !!profile, profileRole: profile?.role });
    
    // Only redirect if user is authenticated and profile is loaded
    if (user && profile) {
      console.log('SuperAdminLogin: User authenticated, role:', profile.role);
      if (profile.role === "super_admin") {
        console.log('SuperAdminLogin: Redirecting to dashboard');
        navigate("/dashboard");
      } else {
        console.log('SuperAdminLogin: User is not super admin, redirecting to role selection');
        // If user is authenticated but not super admin, redirect to role selection
        navigate("/");
      }
    } else {
      console.log('SuperAdminLogin: No user or profile, staying on login page');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password, "super_admin");

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/10 via-transparent to-transparent"></div>
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 p-6 text-white text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-pink-600/80"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">⚡</span>
                </div>
                <h2 className="text-2xl font-bold">Super Admin Login</h2>
              </div>
              <p className="text-purple-100 text-sm">
                Enter your credentials to access the admin dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 bg-white/5 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@parkflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Links */}
              <div className="text-center space-y-3">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-300 hover:text-purple-200 hover:underline block"
                >
                  Forgot your password?
                </Link>
                <Link
                  to="/"
                  className="text-sm text-white/70 hover:text-white hover:underline block"
                >
                  Return to Role Selection
                </Link>
                
                {/* Terms and Privacy Policy */}
                <p className="text-xs text-white/60 leading-relaxed pt-2">
                  By clicking continue, you agree to our{' '}
                  <Link to="/terms-of-service" className="text-purple-300 hover:text-purple-200 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" className="text-purple-300 hover:text-purple-200 underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}