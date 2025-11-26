import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MapPin, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role selection page
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-parkflow-blue/5 via-background to-parkflow-green/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-parkflow-blue" />
            <h1 className="text-xl sm:text-2xl font-bold text-parkflow-blue">ParkFlow</h1>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/register")} className="w-full sm:w-auto">
              Register
            </Button>
            <Button onClick={() => navigate("/login")} className="w-full sm:w-auto">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
          Smart Parking Management
          <span className="block text-parkflow-blue">Made Simple</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Streamline your parking operations with real-time monitoring, automated payments, 
          and comprehensive analytics across multiple locations.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 max-w-md sm:max-w-none mx-auto">
          <Button size="lg" onClick={() => navigate("/register")} className="w-full sm:w-auto">
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/login")} className="w-full sm:w-auto">
            Sign In
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-parkflow-blue mb-2" />
              <CardTitle>Multi-Location Management</CardTitle>
              <CardDescription>
                Manage multiple parking locations from a single dashboard
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-parkflow-green mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Super admin, contractor, and attendant roles with specific permissions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-parkflow-orange mb-2" />
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Monitor occupancy, revenue, and performance in real-time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
