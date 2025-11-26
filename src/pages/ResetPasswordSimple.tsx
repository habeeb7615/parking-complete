import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordSimple() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated (they should be after clicking reset link)
    const checkAuth = async () => {
      const { AuthAPI } = await import('@/services/authApi');
      const isAuthenticated = AuthAPI.isAuthenticated();
      
      if (!isAuthenticated) {
        setError("No active session found. Please request a new password reset.");
      }
    };
    
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Update password using NestJS API
      // TODO: Implement password reset endpoint in backend
      const { AuthAPI } = await import('@/services/authApi');
      const user = AuthAPI.getUser();
      if (!user?.id) throw new Error('User not authenticated');
      
      const { apiClient } = await import('@/lib/apiClient');
      const response = await apiClient.post(`/profiles/updatePassword/${user.id}`, {
        newPassword: password
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update password');
      }

      setSuccess(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error instanceof Error ? error.message : "An error occurred while resetting your password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parkflow-red/10 via-background to-parkflow-blue/10 p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Car className="h-10 w-10 text-parkflow-blue" />
            </div>
            <h1 className="text-3xl font-bold text-parkflow-blue">ParkFlow</h1>
            <h2 className="text-2xl font-bold text-foreground mt-2">
              Password Reset Successful
            </h2>
            <p className="text-muted-foreground text-sm">
              Your password has been updated successfully
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Password Updated!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your password has been successfully updated. You can now log in with your new password.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-parkflow-red/10 via-background to-parkflow-blue/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Car className="h-10 w-10 text-parkflow-blue" />
          </div>
          <h1 className="text-3xl font-bold text-parkflow-blue">ParkFlow</h1>
          <h2 className="text-2xl font-bold text-foreground mt-2">
            Reset Password
          </h2>
          <p className="text-muted-foreground text-sm">
            Enter your new password below
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Enter a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
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
                className="w-full"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </Button>

              {/* Back Link */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2 text-center">Password Requirements</h3>
            <div className="text-xs space-y-1 text-muted-foreground text-center">
              <p>• At least 6 characters long</p>
              <p>• Use a combination of letters, numbers, and symbols</p>
              <p>• Avoid using common passwords or personal information</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
