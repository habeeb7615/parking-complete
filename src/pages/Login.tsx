import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, LogOut, ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "";

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication status
    if (authLoading) {
      return;
    }

    console.log('Login useEffect triggered:', { user: user?.id, profile: profile?.id, role });
    
    // If user is authenticated and session is valid
    if (user && profile && profile.status === "active") {
      // If role parameter is provided and doesn't match current user's role, logout and allow login for new role
      if (role && profile.role !== role) {
        console.log('Login: User is logged in with different role, logging out to allow login for new role:', { currentRole: profile.role, requestedRole: role });
        signOut();
        return;
      }
      
      // If user is already logged in with the same role (or no role specified), redirect to dashboard
      console.log('Login: User is authenticated with valid session, redirecting to dashboard...');
      setLoading(false); // Reset loading state when user is successfully authenticated
      // All authenticated users go to /dashboard, which will show the appropriate dashboard based on role
      // Use replace to prevent back button issues on mobile
      navigate("/dashboard", { replace: true });
    } else {
      console.log('Login: Not ready for navigation yet:', { 
        hasUser: !!user, 
        hasProfile: !!profile, 
        profileStatus: profile?.status 
      });
    }
  }, [user, profile, navigate, authLoading, role, signOut]);

  const handleSignOut = async () => {
    await signOut();
    // Clear form
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Login: Starting login process...', { email, role });

    try {
      const result = await signIn(email, password, role);
      console.log('Login: Sign in result:', result);

      if (result && !result.error) {
        console.log('Login: Sign in successful');
        // For attendant role, we need to manually navigate since useEffect blocks it
        if (role === 'attendant') {
          console.log('Login: Manually navigating to dashboard for attendant');
          setLoading(false);
          navigate("/dashboard", { replace: true });
        } else {
          // For other roles, let useEffect handle navigation
          console.log('Login: Navigation will be handled by useEffect');
          // Set a timeout to reset loading if navigation doesn't happen
          setTimeout(() => {
            console.log('Login: Timeout reached, resetting loading state');
            setLoading(false);
          }, 3000);
        }
      } else {
        console.log('Login: Sign in failed:', result?.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Login: Unexpected error during sign in:', error);
      setLoading(false);
    }
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
			<div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
				{/* Left: Brand Section */}
				<div className="text-white space-y-6 sm:space-y-8 text-center lg:text-left relative z-10">
					<div className="space-y-3 sm:space-y-4">
						<div className="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
								<span className="text-xl sm:text-2xl">CAR</span>
							</div>
							<h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
								ParkFlow
							</h1>
						</div>
						<p className="text-lg sm:text-xl text-white/80 font-light">
							Smart Parking Management Made Easy
						</p>
					</div>
					
					<div className="space-y-3 sm:space-y-4">
						<div className="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs sm:text-sm">✓</span>
							</div>
							<span className="text-base sm:text-lg">Real-time Parking Analytics</span>
						</div>
						<div className="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs sm:text-sm">✓</span>
							</div>
							<span className="text-base sm:text-lg">Secure Role-based Access</span>
						</div>
						<div className="flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs sm:text-sm">✓</span>
							</div>
							<span className="text-base sm:text-lg">Scalable Multi-location Management</span>
						</div>
					</div>
				</div>

				{/* Right: Login Form */}
				<div className="w-full max-w-md mx-auto">
					<Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
						<div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 sm:p-6 text-white relative">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-blue-600/80"></div>
							<div className="relative z-10">
								<div className="text-center">
									<h2 className="text-xl sm:text-2xl font-bold">
										{role ? `${role === "contractor" ? "Contractor" : "Attendant"} Login` : "Sign In"}
									</h2>
									<p className="text-purple-100 text-xs sm:text-sm mt-1">
										{role ? `Enter your credentials to access the ${role} dashboard` : "Enter your credentials to access your dashboard"}
									</p>
								</div>
							</div>
						</div>
						
						<CardContent className="p-6 sm:p-8 bg-white/5 backdrop-blur-sm">
							{user && (
								<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<div className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<p className="text-xs sm:text-sm font-medium text-blue-900 truncate">
												Active Session: {user.email}
											</p>
											<p className="text-xs text-blue-700">
												Role: {profile?.role || 'Unknown'} | Status: {profile?.status || 'Unknown'}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleSignOut}
											className="text-blue-600 hover:text-blue-700 flex-shrink-0 ml-2"
										>
											<LogOut className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
								{/* Email */}
								<div className="space-y-2">
									<Label htmlFor="email" className="text-white font-medium text-sm sm:text-base">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="Enter your email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
									/>
								</div>

								{/* Password */}
								<div className="space-y-2">
									<Label htmlFor="password" className="text-white font-medium text-sm sm:text-base">Password</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Enter your password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											className="h-10 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm pr-12"
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

								{/* Remember Me */}
								<div className="flex items-center space-x-2">
									<Checkbox
										id="remember"
										checked={rememberMe}
										onCheckedChange={(checked) => setRememberMe(checked as boolean)}
										className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
									/>
									<Label htmlFor="remember" className="text-xs sm:text-sm text-white/80">
										Remember me
									</Label>
								</div>

								{/* Sign In Button */}
								<Button
									type="submit"
									className="w-full h-10 sm:h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
									disabled={loading}
								>
									{loading ? "Signing in..." : "Sign In"}
								</Button>

								{/* Links */}
								<div className="text-center space-y-2 sm:space-y-3">
									<Button
										variant="ghost"
										onClick={() => navigate("/")}
										className="text-xs sm:text-sm text-white/70 hover:text-white hover:bg-white/10"
									>
										<ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
										Back to Role Selection
									</Button>
									<div className="space-y-1 sm:space-y-2">
										<Link
											to="/forgot-password"
											className="text-xs sm:text-sm text-purple-300 hover:text-purple-200 hover:underline block"
										>
											Forgot your password?
										</Link>
										<Link
											to="/register"
											className="text-xs sm:text-sm text-white/70 hover:text-white hover:underline block"
										>
											Need an account? Request Access
										</Link>
									</div>
									
									{/* Terms and Privacy Policy */}
									<p className="text-xs text-white/60 leading-relaxed pt-1 sm:pt-2">
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
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
  );
}