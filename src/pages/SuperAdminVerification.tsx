import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Clock } from "lucide-react";

export default function SuperAdminVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  
  const navigate = useNavigate();
  
  // Static OTP for Super Admin verification
  const STATIC_OTP = "123456";
  const MAX_ATTEMPTS = 3;

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check if OTP matches the static code
      if (otp.toUpperCase() === STATIC_OTP) {
        // OTP is valid, proceed to Super Admin login
        console.log('SuperAdminVerification: OTP is valid, navigating to superadminlogin');
        navigate('/superadminlogin');
      } else {
        // Invalid OTP
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setError("Too many failed attempts. Redirecting to Role Selection...");
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setError(`Invalid OTP. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      setError("An error occurred during verification. Please try again.");
      console.error('OTP verification error:', err);
    }
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
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Super Admin Verification</h2>
              </div>
              <p className="text-purple-100 text-sm">
                Enter the 6-digit verification code to access Super Admin
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 bg-white/5 backdrop-blur-sm">
            <form onSubmit={verifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  required
                  className="h-12 text-center text-lg tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 backdrop-blur-sm"
                  maxLength={6}
                />
                <p className="text-xs text-white/60 text-center">
                  Enter the 6-character verification code
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>

            {/* Back Button */}
            <div className="text-center mt-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-sm text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Role Selection
              </Button>
            </div>

            {/* Development Helper - Remove in production */}
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
              <p className="text-xs text-yellow-200 text-center">
                <strong>Development Mode:</strong> Use code <span className="bg-yellow-500/30 px-1 rounded font-mono text-yellow-100">123456</span> for testing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
