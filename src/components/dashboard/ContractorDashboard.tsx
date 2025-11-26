import { useState, useEffect, useRef, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  MapPin,
  Users, 
  Car, 
  Banknote, 
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AttendantAPI, Attendant } from "@/services/attendantApi";
import { LocationAPI, Location } from "@/services/locationApi";
import { VehicleAPI, Vehicle } from "@/services/vehicleApi";
import { PaymentAPI, Payment } from "@/services/paymentApi";
import { ContractorDashboardAPI, ContractorDashboardData, ContractorStats } from "@/services/contractorDashboardApi";
import { ContractorAPI } from "@/services/contractorApi";
import { SubscriptionAPI } from "@/services/subscriptionApi";
import { apiClient } from "@/lib/apiClient";
import { MetricCard } from "./MetricCard";

const ContractorDashboard = memo(function ContractorDashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  // Track if data has been fetched to prevent unnecessary re-fetches
  const dataFetchedRef = useRef(false);
  const [stats, setStats] = useState<ContractorStats>({
    totalLocations: 0,
    totalAttendants: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    occupancyRate: 0,
    todayVehicles: 0
  });

  // Rates state
  const [rates, setRates] = useState({
    rates_2wheeler: {
      upTo2Hours: 2,
      upTo6Hours: 5,
      upTo12Hours: 8,
      upTo24Hours: 12
    },
    rates_4wheeler: {
      upTo2Hours: 5,
      upTo6Hours: 10,
      upTo12Hours: 18,
      upTo24Hours: 30
    }
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesSaving, setRatesSaving] = useState(false);
  const [showRatesEdit, setShowRatesEdit] = useState(false);

  // State for data management
  const [dashboardData, setDashboardData] = useState<ContractorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Subscription state
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    planName: string;
    price: number;
    startDate: string;
    endDate: string;
    status: string;
    daysRemaining: number;
  } | null>(null);
  
  // State for modals
  const [showCreateAttendant, setShowCreateAttendant] = useState(false);
  const [showAssignLocation, setShowAssignLocation] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<Attendant | null>(null);
  
  // State for forms
  const [attendantForm, setAttendantForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    shift_start: '',
    shift_end: ''
  });

  // Data fetching functions
  const fetchContractorData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data, stats, and subscription details
      const [dashboardDataResult, statsResult, subscriptionResult] = await Promise.all([
        ContractorDashboardAPI.getContractorDashboard(user.id),
        ContractorDashboardAPI.getContractorStats(user.id),
        fetchSubscriptionDetails()
      ]);

      // Ensure assignedLocations is always an array
      const safeDashboardData = {
        ...dashboardDataResult,
        assignedLocations: dashboardDataResult?.assignedLocations || []
      };

      setDashboardData(safeDashboardData);
      setStats(statsResult || {
        totalLocations: 0,
        totalAttendants: 0,
        totalVehicles: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        occupancyRate: 0,
        todayVehicles: 0
      });
      setSubscriptionDetails(subscriptionResult);
    } catch (error) {
      console.error('Error fetching contractor data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription details
  const fetchSubscriptionDetails = async () => {
    if (!user?.id) return null;
    
    try {
      const subscription = await SubscriptionAPI.getContractorSubscription(user.id);
      
      if (!subscription) {
        return null;
      }

      return {
        planName: subscription.plan_name || 'Unknown Plan',
        price: 0, // Price not in subscription response, would need to fetch plan separately
        startDate: subscription.start_date || '',
        endDate: subscription.end_date || '',
        status: subscription.status || 'active',
        daysRemaining: subscription.days_remaining || 0
      };
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
  };

  // Fetch contractor rates
  const fetchRates = async () => {
    if (!user?.id) return;
    
    try {
      setRatesLoading(true);
      // Get contractor by user_id
      const contractor = await ContractorAPI.getContractorByUserId(user.id);

      if (contractor) {
        setRates({
          rates_2wheeler: (contractor.rates_2wheeler as any) || rates.rates_2wheeler,
          rates_4wheeler: (contractor.rates_4wheeler as any) || rates.rates_4wheeler
        });
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch rates"
      });
    } finally {
      setRatesLoading(false);
    }
  };

  // Save rates
  const handleSaveRates = async () => {
    if (!user?.id) return;
    
    try {
      setRatesSaving(true);
      // Get contractor by user_id first
      const contractor = await ContractorAPI.getContractorByUserId(user.id);

      if (!contractor) {
        throw new Error('Contractor not found');
      }

      // Update contractor rates using apiClient directly
      await apiClient.post(`/contractors/update/${contractor.id}`, {
        rates_2wheeler: rates.rates_2wheeler,
        rates_4wheeler: rates.rates_4wheeler
      });

      toast({
        title: "Success",
        description: "Rates updated successfully"
      });
      setShowRatesEdit(false);
    } catch (error) {
      console.error('Error saving rates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save rates"
      });
    } finally {
      setRatesSaving(false);
    }
  };

  // Handle rate change
  const handleRateChange = (vehicleType: '2wheeler' | '4wheeler', duration: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setRates(prev => ({
      ...prev,
      [`rates_${vehicleType}`]: {
        ...prev[`rates_${vehicleType}`],
        [duration]: numValue
      }
    }));
  };

  const fetchRecentActivity = async () => {
    if (!user?.id) return;
    
    try {
      // Get contractor ID
      const contractor = await ContractorAPI.getContractorByUserId(user.id);

      if (!contractor) return;

      // Get recent vehicles
      const vehicles = await VehicleAPI.getContractorVehicles(contractor.id);
      const recentVehicles = vehicles
        .filter(v => !(v as any).is_deleted)
        .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
        .slice(0, 5);

      // Get recent payments
      const payments = await PaymentAPI.getContractorPayments(contractor.id, { page: 1, pageSize: 3 });
      const recentPayments = payments.data || [];

      // Combine and format activities
      const activities = [];

      // Add vehicle activities
      recentVehicles?.forEach(vehicle => {
        const timeAgo = getTimeAgo(vehicle.check_in_time);
        const locationName = vehicle.location?.locations_name || 
                           vehicle.parking_locations?.locations_name || 
                           'Unknown';
        activities.push({
          id: `vehicle-${vehicle.id}`,
          type: 'vehicle_checkin',
          title: 'New vehicle check-in',
          description: `Location: ${locationName}`,
          timeAgo,
          timestamp: vehicle.check_in_time,
          icon: 'green'
        });

        if (vehicle.check_out_time) {
          const checkoutTimeAgo = getTimeAgo(vehicle.check_out_time);
          activities.push({
            id: `vehicle-checkout-${vehicle.id}`,
            type: 'vehicle_checkout',
            title: 'Vehicle check-out',
            description: `Plate: ${vehicle.plate_number}`,
            timeAgo: checkoutTimeAgo,
            timestamp: vehicle.check_out_time,
            icon: 'blue'
          });
        }
      });

      // Add payment activities
      recentPayments?.forEach(payment => {
        const timeAgo = getTimeAgo(payment.created_at || payment.created_on || '');
        const plateNumber = payment.vehicle?.plate_number || 'Unknown';
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: 'Payment received',
          description: `₹${(payment.amount || 0).toFixed(2)} from Vehicle ${plateNumber}`,
          timeAgo,
          timestamp: payment.created_at || payment.created_on || '',
          icon: 'orange'
        });
      });

      // Sort by timestamp and take the most recent 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Form handlers
  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // This is a placeholder - actual attendant creation would go through AttendantAPI
      console.log('Creating attendant:', attendantForm);
      setAttendantForm({ name: '', email: '', phone_number: '', shift_start: '', shift_end: '' });
      setShowCreateAttendant(false);
      
      toast({
        title: "Success",
        description: "Attendant creation feature coming soon"
      });
    } catch (error) {
      console.error('Error creating attendant:', error);
    }
  };

  const handleAssignLocation = async (attendantId: string, locationId: string) => {
    try {
      // This is a placeholder - actual location assignment would go through appropriate API
      console.log('Assigning location:', { attendantId, locationId });
      fetchContractorData();
      
      toast({
        title: "Success", 
        description: "Location assignment feature coming soon"
      });
    } catch (error) {
      console.error('Error assigning location:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user && !dataFetchedRef.current) {
      console.log('ContractorDashboard: Initial data fetch triggered');
      dataFetchedRef.current = true;
      fetchContractorData();
      fetchRecentActivity();
      fetchRates();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Contractor Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {profile?.user_name || 'Contractor'}! Manage your parking operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white/50 backdrop-blur">
            <Eye className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Locations"
          value={stats.totalLocations}
          description="Active parking sites"
          icon={MapPin}
          variant="success"
        />
        <MetricCard
          title="Active Attendants"
          value={stats.totalAttendants}
          description="On-duty staff"
          icon={Users}
          variant="warning"
        />
        <MetricCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          description="All-time processed"
          icon={Car}
          variant="info"
        />
        <MetricCard
          title="Today's Vehicles"
          value={stats.todayVehicles}
          description="Checked in today"
          icon={Car}
          variant="default"
        />
        <MetricCard
          title="Today's Revenue"
          value={`₹${(stats.todayRevenue || 0).toFixed(2)}`}
          description="+12% from yesterday"
          icon={Banknote}
          variant="success"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue || 0).toFixed(2)}`}
          description="Lifetime earnings"
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          description="Current utilization"
          icon={BarChart3}
          variant={stats.occupancyRate > 80 ? "danger" : stats.occupancyRate > 60 ? "warning" : "success"}
        />
      </div>

      {/* Subscription Details Section */}
      {subscriptionDetails && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <Crown className="h-5 w-5" />
                  <span>Your Subscription Plan</span>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Current subscription details and status
                </CardDescription>
              </div>
              <Badge 
                variant={subscriptionDetails.status === 'active' ? 'default' : 'destructive'}
                className={subscriptionDetails.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              >
                {subscriptionDetails.status === 'active' ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {subscriptionDetails.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Plan Name */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Plan Name</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">{subscriptionDetails.planName}</p>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Price</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">₹{subscriptionDetails.price}</p>
              </div>

              {/* Days Remaining */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Days Remaining</span>
                </div>
                <p className={`text-lg font-semibold ${
                  subscriptionDetails.daysRemaining <= 7 ? 'text-red-600' : 
                  subscriptionDetails.daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {subscriptionDetails.daysRemaining} days
                </p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Expires On</span>
                </div>
                <p className="text-lg font-semibold text-blue-900">
                  {formatDate(subscriptionDetails.endDate)}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Started on {formatDate(subscriptionDetails.startDate)}
                </span>
              </div>
              {subscriptionDetails.daysRemaining <= 7 && (
                <div className="mt-2 flex items-center space-x-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Your subscription expires soon! Contact support to renew.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Subscription Warning */}
      {!subscriptionDetails && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              <span>No Active Subscription</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              You don't have an active subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-800 mb-2">
                  Contact your administrator to get a subscription plan assigned to your account.
                </p>
                <p className="text-sm text-orange-600">
                  Without a subscription, you may have limited access to certain features.
                </p>
              </div>
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parking Rates Section */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/30 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="h-5 w-5" />
                <span>Your Parking Rates</span>
              </CardTitle>
              <CardDescription>
                Current rates assigned to your account. You can update these rates anytime.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowRatesEdit(true)}
              className="bg-white/50 backdrop-blur"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Rates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2-Wheeler Rates */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">2-Wheeler Rates</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 2 hours</span>
                  <span className="font-medium">₹{rates.rates_2wheeler.upTo2Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 6 hours</span>
                  <span className="font-medium">₹{rates.rates_2wheeler.upTo6Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 12 hours</span>
                  <span className="font-medium">₹{rates.rates_2wheeler.upTo12Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 24 hours</span>
                  <span className="font-medium">₹{rates.rates_2wheeler.upTo24Hours}</span>
                </div>
              </div>
            </div>

            {/* 4-Wheeler Rates */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">4-Wheeler Rates</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 2 hours</span>
                  <span className="font-medium">₹{rates.rates_4wheeler.upTo2Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 6 hours</span>
                  <span className="font-medium">₹{rates.rates_4wheeler.upTo6Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 12 hours</span>
                  <span className="font-medium">₹{rates.rates_4wheeler.upTo12Hours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Up to 24 hours</span>
                  <span className="font-medium">₹{rates.rates_4wheeler.upTo24Hours}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/30 rounded-xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.icon === 'green' ? 'bg-green-500' :
                      activity.icon === 'blue' ? 'bg-blue-500' :
                      activity.icon === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.timeAgo}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Overview */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/30 rounded-xl">
        <CardHeader>
          <CardTitle>Your Locations</CardTitle>
          <CardDescription>Manage and monitor your parking locations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading locations...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : !dashboardData?.assignedLocations || dashboardData.assignedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-muted-foreground mb-4">
                Your account has no assigned locations yet. Contact your administrator or create sample data for testing.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to assign parking locations to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData?.assignedLocations.map((location, index) => {
                const colorClass = index % 3 === 0 ? 'text-blue-500' : 
                                 index % 3 === 1 ? 'text-green-500' : 'text-orange-500';
                const statusClass = location.status === 'active' ? 
                  'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
                
                return (
                  <div key={location.locationId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className={`h-5 w-5 ${colorClass}`} />
                      <div>
                        <p className="font-medium">{location.locationName}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {location.totalSlots} slots • {location.occupancyRate}% occupied
                        </p>
                        {location.attendants && location.attendants.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {location.attendants.length} attendant(s) assigned
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={statusClass}>
                        {location.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates Edit Dialog */}
      <Dialog open={showRatesEdit} onOpenChange={setShowRatesEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Parking Rates</DialogTitle>
            <DialogDescription>
              Update your parking rates for different vehicle types and durations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 2-Wheeler Rates */}
            <div className="space-y-4">
              <h4 className="font-semibold">2-Wheeler Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="2wheeler-2h">Up to 2 hours</Label>
                  <Input
                    id="2wheeler-2h"
                    type="number"
                    value={rates.rates_2wheeler.upTo2Hours}
                    onChange={(e) => handleRateChange('2wheeler', 'upTo2Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2wheeler-6h">Up to 6 hours</Label>
                  <Input
                    id="2wheeler-6h"
                    type="number"
                    value={rates.rates_2wheeler.upTo6Hours}
                    onChange={(e) => handleRateChange('2wheeler', 'upTo6Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2wheeler-12h">Up to 12 hours</Label>
                  <Input
                    id="2wheeler-12h"
                    type="number"
                    value={rates.rates_2wheeler.upTo12Hours}
                    onChange={(e) => handleRateChange('2wheeler', 'upTo12Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="2wheeler-24h">Up to 24 hours</Label>
                  <Input
                    id="2wheeler-24h"
                    type="number"
                    value={rates.rates_2wheeler.upTo24Hours}
                    onChange={(e) => handleRateChange('2wheeler', 'upTo24Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* 4-Wheeler Rates */}
            <div className="space-y-4">
              <h4 className="font-semibold">4-Wheeler Rates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="4wheeler-2h">Up to 2 hours</Label>
                  <Input
                    id="4wheeler-2h"
                    type="number"
                    value={rates.rates_4wheeler.upTo2Hours}
                    onChange={(e) => handleRateChange('4wheeler', 'upTo2Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="4wheeler-6h">Up to 6 hours</Label>
                  <Input
                    id="4wheeler-6h"
                    type="number"
                    value={rates.rates_4wheeler.upTo6Hours}
                    onChange={(e) => handleRateChange('4wheeler', 'upTo6Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="4wheeler-12h">Up to 12 hours</Label>
                  <Input
                    id="4wheeler-12h"
                    type="number"
                    value={rates.rates_4wheeler.upTo12Hours}
                    onChange={(e) => handleRateChange('4wheeler', 'upTo12Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="4wheeler-24h">Up to 24 hours</Label>
                  <Input
                    id="4wheeler-24h"
                    type="number"
                    value={rates.rates_4wheeler.upTo24Hours}
                    onChange={(e) => handleRateChange('4wheeler', 'upTo24Hours', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRatesEdit(false)}
                disabled={ratesSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveRates}
                disabled={ratesSaving}
              >
                {ratesSaving ? 'Saving...' : 'Save Rates'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export { ContractorDashboard };