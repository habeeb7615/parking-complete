import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Eye, EyeOff, UserPlus } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    role: "" as "contractor" | "attendant" | "",
    contractor_name: "",
    attendant_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!formData.role) {
      alert("Please select a role!");
      return;
    }

    setLoading(true);

    const userData = {
      user_name: formData.user_name,
      email: formData.email,
      phone_number: formData.phone_number,
      role: formData.role,
      contractor_name: formData.role === "contractor" ? formData.contractor_name : undefined,
      attendant_name: formData.role === "attendant" ? formData.attendant_name : undefined,
    };

    const response = await signUp(formData.email, formData.password, userData);

    if (response.success) {
      navigate("/login");
    } else {
      console.error("Signup failed:", response.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/10 via-transparent to-transparent"></div>
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      <div className="w-full max-w-md sm:max-w-lg space-y-4 sm:space-y-6 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">ParkFlow</h1>
          <p className="text-emerald-300 font-medium mt-1 sm:mt-2 text-sm sm:text-base">
            Request Access
          </p>
          <p className="text-white/80 text-xs sm:text-sm px-4">
            Create an account to join the parking management system
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-blue-600/80"></div>
            <div className="relative z-10">
              <CardTitle className="text-lg sm:text-xl">Create Account</CardTitle>
              <CardDescription className="text-purple-100 text-sm">
                Fill in your details to request system access
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 bg-white/5 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white font-medium">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="attendant">Attendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="space-y-2">
                <Label htmlFor="user_name" className="text-white font-medium">Full Name *</Label>
                <Input
                  id="user_name"
                  placeholder="Enter your full name"
                  value={formData.user_name}
                  onChange={(e) => handleInputChange("user_name", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                />
              </div>

              {/* Role-specific name fields */}
              {formData.role === "contractor" && (
                <div className="space-y-2">
                  <Label htmlFor="contractor_name" className="text-white font-medium">Company/Business Name</Label>
                  <Input
                    id="contractor_name"
                    placeholder="Enter your company name"
                    value={formData.contractor_name}
                    onChange={(e) => handleInputChange("contractor_name", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                  />
                </div>
              )}

              {formData.role === "attendant" && (
                <div className="space-y-2">
                  <Label htmlFor="attendant_name" className="text-white font-medium">Display Name</Label>
                  <Input
                    id="attendant_name"
                    placeholder="Enter your display name"
                    value={formData.attendant_name}
                    onChange={(e) => handleInputChange("attendant_name", e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-white font-medium">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Request Access"}
              </Button>

              {/* Info Notice */}
              <div className="bg-blue-500/20 border border-blue-400/30 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-xs text-blue-200 font-medium text-center">
                  ℹ️ Account Activation Required
                </p>
                <p className="text-xs text-white/80 mt-1 text-center">
                  Your account will need to be activated by an administrator before you can sign in
                </p>
              </div>

              {/* Back Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-white/70 hover:text-white hover:underline"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}