import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { success } = await resetPassword(email);

    if (success) {
      setEmailSent(true);
    }

    setLoading(false);
  };

  if (emailSent) {
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
              Check Your Email
            </h2>
            <p className="text-muted-foreground text-sm">
              We've sent password reset instructions to your email
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
                    Email Sent Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please check your email and follow the instructions to reset your password.
                    If you don't see the email, check your spam folder.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Another Email
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="ghost"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
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
            Forgot Password
          </h2>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address to receive password reset instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              {/* Back Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:underline flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2 text-center">Need Help?</h3>
            <div className="text-xs space-y-1 text-muted-foreground text-center">
              <p>• Make sure you enter the email address associated with your account</p>
              <p>• Check your spam folder if you don't receive the email</p>
              <p>• Contact your administrator if you continue to have issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
