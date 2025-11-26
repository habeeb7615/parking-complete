import { useEffect, useState, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Users, Car, Banknote, TrendingUp, Plus, Edit, Trash2, Eye, Settings, BarChart3 } from "lucide-react";
import { SuperAdminAPI, Contractor, Location, Attendant, CreateContractorData, CreateLocationData, CreateAttendantData } from "@/services/superAdminApi";
import { MetricCard } from "./MetricCard";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Realtime subscriptions disabled - NestJS doesn't have built-in realtime
// import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalContractors: number;
  totalLocations: number;
  totalAttendants: number;
  totalVehicles: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  todayVehicles: number;
  monthlyVehicles: number;
}

interface AnalyticsData {
  today: { vehicles: number; revenue: number };
  yesterday: { vehicles: number; revenue: number };
  thisMonth: { vehicles: number; revenue: number };
  lastMonth: { vehicles: number; revenue: number };
}

const SuperAdminDashboard = memo(function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track if data has been fetched to prevent unnecessary re-fetches
  const dataFetchedRef = useRef(false);
  
  // Data states
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  
  // Modal states
  const [showCreateContractor, setShowCreateContractor] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [showCreateAttendant, setShowCreateAttendant] = useState(false);
  
  // Loading states
  const [isCreatingContractor, setIsCreatingContractor] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [isCreatingAttendant, setIsCreatingAttendant] = useState(false);
  
  // Form states
  const [contractorForm, setContractorForm] = useState<CreateContractorData>({
    company_name: '',
    contact_number: '',
    email: '',
    password: '',
    allowed_locations: 5,
    allowed_attendants_per_location: 3
  });
  
  const [locationForm, setLocationForm] = useState<CreateLocationData>({
    locations_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contractor_id: '',
    total_slots: 50
  });
  
  const [attendantForm, setAttendantForm] = useState<CreateAttendantData>({
    user_name: '',
    email: '',
    password: '',
    phone_number: '',
    location_id: ''
  });
  
  const { toast } = useToast();

  // Real-time subscriptions disabled - NestJS doesn't have built-in realtime like Supabase
  // TODO: Implement WebSocket or polling for real-time updates if needed
  // useRealtimeSubscription({
  //   table: 'contractors',
  //   event: '*',
  // });
  // useRealtimeSubscription({
  //   table: 'parking_locations', 
  //   event: '*',
  // });
  // useRealtimeSubscription({
  //   table: 'attendants',
  //   event: '*',
  // });
  // useRealtimeSubscription({
  //   table: 'vehicles',
  //   event: '*',
  // });

  // Data fetching functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsData, analyticsData, contractorsData, locationsData, attendantsData] = await Promise.all([
        SuperAdminAPI.getDashboardStats(),
        SuperAdminAPI.getSystemAnalytics(),
        SuperAdminAPI.getAllContractors(),
        SuperAdminAPI.getAllLocations(),
        SuperAdminAPI.getAllAttendants()
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setContractors(contractorsData);
      setLocations(locationsData);
      setAttendants(attendantsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingContractor(true);
    
    try {
      // Validate form data
      if (!contractorForm.company_name || !contractorForm.email || !contractorForm.password) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      const result = await SuperAdminAPI.createContractor(contractorForm);
      
      toast({
        title: "Success",
        description: "Contractor created successfully"
      });
      
      setContractorForm({
        company_name: '',
        contact_number: '',
        email: '',
        password: '',
        allowed_locations: 5,
        allowed_attendants_per_location: 3
      });
      setShowCreateContractor(false);
      fetchDashboardData();
      // Ensure we remain on Super Admin dashboard after creation
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating contractor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create contractor"
      });
    } finally {
      setIsCreatingContractor(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingLocation(true);
    
    try {
      // Validate form data
      if (!locationForm.locations_name || !locationForm.address || !locationForm.contractor_id) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      const result = await SuperAdminAPI.createLocation(locationForm);
      
      toast({
        title: "Success",
        description: "Location created successfully"
      });
      
      setLocationForm({
        locations_name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contractor_id: '',
        total_slots: 50
      });
      setShowCreateLocation(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create location"
      });
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAttendant(true);
    
    try {
      // Validate form data
      if (!attendantForm.user_name || !attendantForm.email || !attendantForm.password) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      const result = await SuperAdminAPI.createAttendant(attendantForm);
      
      toast({
        title: "Success",
        description: "Attendant created successfully"
      });
      
      setAttendantForm({
        user_name: '',
        email: '',
        password: '',
        phone_number: '',
        location_id: ''
      });
      setShowCreateAttendant(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error creating attendant:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create attendant"
      });
    } finally {
      setIsCreatingAttendant(false);
    }
  };

  const handleDeleteContractor = async (id: string) => {
    try {
      await SuperAdminAPI.deleteContractor(id);
      toast({
        title: "Success",
        description: "Contractor deleted successfully"
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting contractor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contractor"
      });
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await SuperAdminAPI.deleteLocation(id);
      toast({
        title: "Success",
        description: "Location deleted successfully"
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete location"
      });
    }
  };

  const handleDeleteAttendant = async (id: string) => {
    try {
      await SuperAdminAPI.deleteAttendant(id);
      toast({
        title: "Success",
        description: "Attendant deleted successfully"
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting attendant:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete attendant"
      });
    }
  };

  useEffect(() => {
    if (!dataFetchedRef.current) {
      console.log('SuperAdminDashboard: Initial data fetch triggered');
      dataFetchedRef.current = true;
      fetchDashboardData();
    }
  }, []);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const vehicleTrend = analytics?.today?.vehicles !== undefined && analytics?.yesterday?.vehicles !== undefined 
    ? calculateTrend(analytics.today.vehicles, analytics.yesterday.vehicles) : 0;
  const revenueTrend = analytics?.today?.revenue !== undefined && analytics?.yesterday?.revenue !== undefined 
    ? calculateTrend(analytics.today.revenue, analytics.yesterday.revenue) : 0;
  const monthlyVehicleTrend = analytics?.thisMonth?.vehicles !== undefined && analytics?.lastMonth?.vehicles !== undefined 
    ? calculateTrend(analytics.thisMonth.vehicles, analytics.lastMonth.vehicles) : 0;
  const monthlyRevenueTrend = analytics?.thisMonth?.revenue !== undefined && analytics?.lastMonth?.revenue !== undefined 
    ? calculateTrend(analytics.thisMonth.revenue, analytics.lastMonth.revenue) : 0;

  // Hide inline management tabs on Super Admin dashboard (left navigation already provides these)
  const showManagementTabs = false;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Super Admin Dashboard</h2>
          <p className="text-sm sm:text-base text-slate-600">
            Complete overview and management of your ParkFlow system
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="bg-white/50 backdrop-blur w-full sm:w-auto">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Reports
          </Button>
          <Button variant="outline" className="bg-white/50 backdrop-blur w-full sm:w-auto">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Contractors"
          value={stats?.totalContractors || 0}
          description="Active businesses"
          icon={Building2}
          variant="info"
        />
        <MetricCard
          title="Total Locations"
          value={stats?.totalLocations || 0}
          description="Parking locations"
          icon={MapPin}
          variant="success"
        />
        <MetricCard
          title="Total Attendants"
          value={stats?.totalAttendants || 0}
          description="Active staff members"
          icon={Users}
          variant="warning"
        />
        <MetricCard
          title="Total Vehicles"
          value={stats?.totalVehicles || 0}
          description="Vehicles managed"
          icon={Car}
          variant="default"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toFixed(2) || 0}`}
          description="All time earnings"
          icon={Banknote}
          variant="success"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Vehicles"
          value={stats?.todayVehicles || 0}
          description="Vehicles checked in today"
          icon={Car}
          variant="info"
          trend={{
            value: vehicleTrend,
            label: "vs yesterday"
          }}
        />
        <MetricCard
          title="Today's Revenue"
          value={`₹${(stats?.todayRevenue || 0).toFixed(2)}`}
          description="Revenue earned today"
          icon={Banknote}
          variant="success"
          trend={{
            value: revenueTrend,
            label: "vs yesterday"
          }}
        />
        <MetricCard
          title="Monthly Vehicles"
          value={stats?.monthlyVehicles || 0}
          description="This month's traffic"
          icon={TrendingUp}
          variant="warning"
          trend={{
            value: monthlyVehicleTrend,
            label: "vs last month"
          }}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`₹${(stats?.monthlyRevenue || 0).toFixed(2)}`}
          description="This month's earnings"
          icon={TrendingUp}
          variant="success"
          trend={{
            value: monthlyRevenueTrend,
            label: "vs last month"
          }}
        />
      </div>

      {/* Management Tabs (hidden; available via left sidebar) */}
      {showManagementTabs && (
      <Tabs defaultValue="contractors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="attendants">Attendants</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contractor Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all contractors in your system
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateContractor(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </Button>
              
              <Dialog open={showCreateContractor} onOpenChange={setShowCreateContractor}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Contractor</DialogTitle>
                    <DialogDescription>
                      Add a new contractor to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateContractor} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={contractorForm.company_name}
                          onChange={(e) => setContractorForm({...contractorForm, company_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_number">Contact Number</Label>
                        <Input
                          id="contact_number"
                          value={contractorForm.contact_number}
                          onChange={(e) => setContractorForm({...contractorForm, contact_number: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contractorForm.email}
                          onChange={(e) => setContractorForm({...contractorForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={contractorForm.password}
                          onChange={(e) => setContractorForm({...contractorForm, password: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateContractor(false)}
                        disabled={isCreatingContractor}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingContractor}>
                        {isCreatingContractor ? "Creating..." : "Create Contractor"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium">{contractor.company_name}</TableCell>
                      <TableCell>{contractor.contact_number}</TableCell>
                      <TableCell>{contractor.profiles?.email}</TableCell>
                      <TableCell>
                        <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                          {contractor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteContractor(contractor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Location Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all parking locations
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateLocation(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
              
              <Dialog open={showCreateLocation} onOpenChange={setShowCreateLocation}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Location</DialogTitle>
                    <DialogDescription>
                      Add a new parking location
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateLocation} className="space-y-4">
                    <div>
                      <Label htmlFor="locations_name">Location Name</Label>
                      <Input
                        id="locations_name"
                        value={locationForm.locations_name}
                        onChange={(e) => setLocationForm({...locationForm, locations_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={locationForm.address}
                        onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contractor_id">Contractor</Label>
                      <Select value={locationForm.contractor_id} onValueChange={(value) => setLocationForm({...locationForm, contractor_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contractor" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractors.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id}>
                              {contractor.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateLocation(false)}
                        disabled={isCreatingLocation}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingLocation}>
                        {isCreatingLocation ? "Creating..." : "Create Location"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Slots</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.locations_name}</TableCell>
                      <TableCell>{location.address}</TableCell>
                      <TableCell>{location.contractors?.company_name}</TableCell>
                      <TableCell>{location.total_slots}</TableCell>
                      <TableCell>
                        <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                          {location.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendants Tab */}
        <TabsContent value="attendants" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendant Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage all attendants and their assignments
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateAttendant(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attendant
              </Button>
              
              <Dialog open={showCreateAttendant} onOpenChange={setShowCreateAttendant}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Attendant</DialogTitle>
                    <DialogDescription>
                      Add a new attendant to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAttendant} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user_name">Attendant Name</Label>
                        <Input
                          id="user_name"
                          value={attendantForm.user_name}
                          onChange={(e) => setAttendantForm({...attendantForm, user_name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={attendantForm.phone_number}
                          onChange={(e) => setAttendantForm({...attendantForm, phone_number: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={attendantForm.email}
                          onChange={(e) => setAttendantForm({...attendantForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={attendantForm.password}
                          onChange={(e) => setAttendantForm({...attendantForm, password: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location_id">Assigned Location</Label>
                      <Select value={attendantForm.location_id} onValueChange={(value) => setAttendantForm({...attendantForm, location_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.locations_name} - {location.contractors?.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateAttendant(false)}
                        disabled={isCreatingAttendant}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingAttendant}>
                        {isCreatingAttendant ? "Creating..." : "Create Attendant"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendant Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Assigned Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendants.map((attendant) => (
                    <TableRow key={attendant.id}>
                      <TableCell className="font-medium">{attendant.profiles?.user_name}</TableCell>
                      <TableCell>{attendant.profiles?.email}</TableCell>
                      <TableCell>{attendant.profiles?.phone_number}</TableCell>
                      <TableCell>{attendant.parking_locations?.locations_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant={attendant.status === 'active' ? 'default' : 'secondary'}>
                          {attendant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteAttendant(attendant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <QuickActions />
            <RecentActivity />
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
});

export { SuperAdminDashboard };
