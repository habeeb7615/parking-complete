import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CameraCapture } from "@/components/ui/camera-capture";
import { CheckoutDialog } from "@/components/ui/checkout-dialog";
import { CheckoutSuccessDialog } from "@/components/ui/checkout-success-dialog";
import { ConfirmCheckoutDialog } from "@/components/ui/confirm-checkout-dialog";
import { ConfirmCheckinDialog } from "@/components/ui/confirm-checkin-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Clock, Banknote, Trash2, Plus, Camera, Car as CarIcon, Bike, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useEffect, useMemo, useState } from "react";
import { VehicleAPI, Vehicle, CreateVehicleData } from "@/services/vehicleApi";
import { OCRService } from "@/services/ocrService";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/utils/dateUtils";
import { checkAttendantContractorSubscription } from "@/utils/subscriptionUtils";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { ContractorAPI } from "@/services/contractorApi";
import { AttendantAPI } from "@/services/attendantApi";
import { LocationAPI } from "@/services/locationApi";

type ContractorMap = { [contractorId: string]: string };

export default function Vehicles() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contractors, setContractors] = useState<ContractorMap>({});
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<CreateVehicleData>({
    plate_number: '',
    vehicle_type: '4-wheeler',
    location_id: '',
    contractor_id: '',
    mobile_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmCheckin, setShowConfirmCheckin] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [contractorRates, setContractorRates] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<{
    paymentAmount: number;
    paymentMethod: string;
    duration: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const isSuperAdmin = profile?.role === "super_admin";
  const isAttendant = profile?.role === "attendant";
  const isContractor = profile?.role === "contractor";


  const calculateDuration = (checkInTime: string, checkOutTime: string | null) => {
    if (!checkOutTime) return '-';
    
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatPayment = (vehicle: Vehicle) => {
    // Only show payment for vehicles that have been checked out
    if (vehicle.check_out_time && vehicle.payment_amount != null) {
      // Convert to number if it's a string, handle null/undefined
      let amount: number;
      if (typeof vehicle.payment_amount === 'number') {
        amount = vehicle.payment_amount;
      } else {
        const parsed = parseFloat(String(vehicle.payment_amount));
        amount = isNaN(parsed) ? 0 : parsed;
      }
      
      // Ensure amount is a valid number before calling toFixed
      if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
        return `₹${amount.toFixed(2)}`;
      }
    }
    
    // For parked vehicles, show "-" instead of estimated payment
    return '-';
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    if (status === 'checked_in') {
      return <span className="text-sm">Parked</span>;
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Checked Out
        </Badge>
      );
    }
  };

  const getVehicleType = (type: string) => {
    return type === '2-wheeler' ? '2 Wheeler' : '4 Wheeler';
  };

  const PaginationComponent = ({ vehicleList }: { vehicleList: Vehicle[] }) => {
    const totalPages = getTotalPages(vehicleList);
    const paginatedVehicles = getPaginatedVehicles(vehicleList);
    
    // Always show pagination component, even for small datasets
    // This ensures per page selector is always visible

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, vehicleList.length)} of {vehicleList.length} vehicles
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-gray-500">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
              <SelectTrigger className="w-16 sm:w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs sm:text-sm text-gray-500">per page</span>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="flex space-x-1">
              {getPageNumbers().map((page, index) => (
                <Button
                  key={index}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                  disabled={page === '...'}
                  className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderVehicleTable = (vehicleList: Vehicle[]) => {
    const paginatedVehicles = getPaginatedVehicles(vehicleList);
    
    return (
      <div>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-hidden rounded-lg border">
          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
            <div className={`grid gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-gray-700 ${isAttendant ? 'grid-cols-8' : 'grid-cols-9'}`} style={{ gridTemplateColumns: isAttendant ? '1fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr' : '1fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr 1fr' }}>
              <div>Plate Number</div>
              <div>Mobile Number</div>
              <div>Type</div>
              <div>Check-in</div>
              <div>Check-out</div>
              <div>Duration</div>
              <div>Payment</div>
              {!isAttendant && <div>Contractor Name</div>}
              {!isAttendant && <div>Location</div>}
              {isAttendant && <div>Actions</div>}
            </div>
          </div>
          
          <div className="divide-y">
            {paginatedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                <div className={`grid gap-2 sm:gap-4 items-center text-xs sm:text-sm ${isAttendant ? 'grid-cols-8' : 'grid-cols-9'}`} style={{ gridTemplateColumns: isAttendant ? '1fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr' : '1fr 1fr 0.8fr 1.2fr 1.2fr 0.8fr 0.8fr 1fr 1fr' }}>
                  <div className="font-medium text-gray-900">
                    {vehicle.plate_number}
                  </div>
                  
                  <div className="text-gray-600 truncate">
                    {vehicle.mobile_number || '-'}
                  </div>
                  
                  <div className="text-gray-600">
                    {getVehicleType(vehicle.vehicle_type)}
                  </div>
                  
                  <div className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                    {formatDateTime(vehicle.check_in_time)}
                  </div>
                  
                  <div className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                    {vehicle.check_out_time ? formatDateTime(vehicle.check_out_time) : '-'}
                  </div>
                  
                  <div className="text-gray-600">
                    {calculateDuration(vehicle.check_in_time, vehicle.check_out_time)}
                  </div>
                  
                  <div className="text-gray-600">
                    {formatPayment(vehicle)}
                  </div>
                  
                  {!isAttendant && (
                    <div className="text-gray-600 truncate">
                      {vehicle.parking_locations?.contractors?.company_name || 'Unknown Contractor'}
                    </div>
                  )}
                  
                  {!isAttendant && (
                    <div className="text-gray-600 truncate">
                      {vehicle.parking_locations?.locations_name || 'Unknown Location'}
                    </div>
                  )}
                  
                  {isAttendant && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {!vehicle.check_out_time ? (
                        <Button
                          size="sm"
                          onClick={() => handleCheckoutClick(vehicle)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-3"
                        >
                          Check Out
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                          Completed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {paginatedVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-sm">{vehicle.plate_number}</h3>
                      <p className="text-xs text-muted-foreground">{getVehicleType(vehicle.vehicle_type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(vehicle)}
                    {isAttendant && (
                      <div>
                        {!vehicle.check_out_time ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckoutClick(vehicle)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Check Out
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span>{vehicle.mobile_number || '-'}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-muted-foreground text-xs">Check-in:</span>
                    <span className="text-xs break-all">{formatDateTime(vehicle.check_in_time)}</span>
                  </div>
                  {vehicle.check_out_time && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-muted-foreground text-xs">Check-out:</span>
                      <span className="text-xs break-all">{formatDateTime(vehicle.check_out_time)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{calculateDuration(vehicle.check_in_time, vehicle.check_out_time)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground">Payment:</span>
                    <span>{formatPayment(vehicle)}</span>
                  </div>
                  {!isAttendant && (
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Contractor:</span>
                      <span className="truncate">{vehicle.parking_locations?.contractors?.company_name || 'Unknown'}</span>
                    </div>
                  )}
                  {!isAttendant && (
                    <div className="flex items-center space-x-1">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="truncate">{vehicle.parking_locations?.locations_name || 'Unknown'}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <PaginationComponent vehicleList={vehicleList} />
      </div>
    );
  };

  // Reset pagination when vehicles change
  useEffect(() => {
    resetPagination();
  }, [vehicles]);

  // Reset pagination when search query changes
  useEffect(() => {
    resetPagination();
  }, [searchQuery]);

  // Check subscription status for attendants (non-blocking)
  useEffect(() => {
    if (profile?.role === 'attendant' && profile?.id) {
      // Run subscription check in background without blocking page load
      checkAttendantContractorSubscription(profile.id)
        .then((status) => {
          console.log('Subscription status for attendant (Vehicles):', status);
          if (status.isExpired || status.isSuspended) {
            setSubscriptionBlocked(true);
            toast({
              variant: "destructive",
              title: "Access Blocked",
              description: "Your contractor's subscription has expired. Please contact your contractor to recharge.",
            });
          }
        })
        .catch((error) => {
          console.error('Error checking subscription status (Vehicles):', error);
          // Don't block access if there's an error checking subscription
        });
    }
  }, [profile, toast]);

  useEffect(() => {
    const load = async () => {
      try {
        
        if (isSuperAdmin) {
          const all = await VehicleAPI.getAllVehicles();
          setVehicles(all);
          const contractorsData = await ContractorAPI.getAllContractors();
          const map: ContractorMap = {};
          contractorsData.forEach((c) => {
            map[c.id] = c.company_name || '';
          });
          setContractors(map);
        } else if (isAttendant) {
          // For attendants, load their vehicles
          const all = await VehicleAPI.getAttendantVehicles();
          setVehicles(all);
          
          // Load attendant's location
          if (profile?.id) {
            try {
              const attendant = await AttendantAPI.getAttendantByUserId(profile.id);
              
              if (attendant && attendant.location_id) {
                // Get location details
                const location = await LocationAPI.getLocationById(attendant.location_id);
                
                if (location) {
                  setLocations([location]);
                  setNewVehicle(prev => ({
                    ...prev,
                    location_id: attendant.location_id || '',
                    contractor_id: location.contractor_id
                  }));

                  // Fetch contractor rates for checkout calculation
                  const contractor = await ContractorAPI.getContractorById(location.contractor_id);
                  
                  if (contractor) {
                    setContractorRates({
                      rates_2wheeler: contractor.rates_2wheeler,
                      rates_4wheeler: contractor.rates_4wheeler
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error loading attendant location:', error);
            }
          }
        } else if (isContractor) {
          // For contractors, load their vehicles
          if (profile?.id) {
            try {
              // Get contractor by user ID
              const contractorData = await ContractorAPI.getContractorByUserId(profile.id);

              if (contractorData && contractorData.id) {
                const all = await VehicleAPI.getContractorVehicles(contractorData.id);
                setVehicles(all);
                
                // Load contractor's locations
                const locationsData = await ContractorAPI.getContractorLocations(contractorData.id);
                
                // Filter active locations
                const activeLocations = locationsData.filter(loc => 
                  loc.is_deleted === false && loc.status === 'active'
                );
                
                setLocations(activeLocations);
              } else {
                // If no contractor record found, show empty list
                setVehicles([]);
                setLocations([]);
              }
            } catch (error) {
              console.error('Error loading contractor data:', error);
              setVehicles([]);
              setLocations([]);
            }
          } else {
            setVehicles([]);
            setLocations([]);
          }
        } else {
          setVehicles([]);
          setLocations([]);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setVehicles([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isSuperAdmin, isAttendant, isContractor, profile?.id]);

  const grouped = useMemo(() => {
    if (!isSuperAdmin) return {} as { [k: string]: { [l: string]: Vehicle[] } };
    const byContractor: { [k: string]: { [l: string]: Vehicle[] } } = {};
    vehicles.forEach(v => {
      const contractorId = v.location?.contractor_id || "unknown";
      const locationName = v.location?.name || "Unknown Location";
      byContractor[contractorId] = byContractor[contractorId] || {};
      byContractor[contractorId][locationName] = byContractor[contractorId][locationName] || [];
      byContractor[contractorId][locationName].push(v);
    });
    return byContractor;
  }, [vehicles, isSuperAdmin]);

  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const currentlyParked = vehicles.filter(v => v.check_out_time === null).length;
    const checkedOut = vehicles.filter(v => v.check_out_time !== null);
    const totalRevenue = vehicles.reduce((sum, v) => sum + (v.payment_amount || 0), 0);
    
    // Calculate average duration for checked out vehicles
    let averageDuration = 0;
    if (checkedOut.length > 0) {
      const totalDuration = checkedOut.reduce((sum, v) => {
        if (v.check_in_time && v.check_out_time) {
          const duration = new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime();
          return sum + duration;
        }
        return sum;
      }, 0);
      averageDuration = totalDuration / checkedOut.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      totalVehicles,
      currentlyParked,
      averageDuration: Math.round(averageDuration * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }, [vehicles]);

  // Search and filter logic
  const getVehicleStatus = (vehicle: Vehicle) => {
    return vehicle.check_out_time === null ? 'checked_in' : 'checked_out';
  };

  const filterVehicles = (vehicleList: Vehicle[]) => {
    if (!searchQuery.trim()) return vehicleList;
    
    const query = searchQuery.toLowerCase();
    return vehicleList.filter(vehicle => 
      vehicle.plate_number.toLowerCase().includes(query) ||
      vehicle.parking_locations?.locations_name?.toLowerCase().includes(query) ||
      vehicle.mobile_number?.toLowerCase().includes(query) ||
      vehicle.vehicle_type.toLowerCase().includes(query) ||
      getVehicleStatus(vehicle).toLowerCase().includes(query)
    );
  };

  const allVehicles = filterVehicles(vehicles.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()));
  const currentlyParkedVehicles = filterVehicles(vehicles.filter(v => v.check_out_time === null));
  const checkedOutVehicles = filterVehicles(vehicles.filter(v => v.check_out_time !== null));
  

  // Pagination logic
  const getPaginatedVehicles = (vehicleList: Vehicle[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return vehicleList.slice(startIndex, endIndex);
  };

  const getTotalPages = (vehicleList: Vehicle[]) => {
    return Math.ceil(vehicleList.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.plate_number || !newVehicle.vehicle_type) {
      alert('Please fill in all required fields');
      return;
    }

    // Show confirmation dialog first
    setShowConfirmCheckin(true);
  };

  const handleConfirmCheckin = async () => {
    try {
      setLoading(true);
      const vehicle = await VehicleAPI.createVehicle(newVehicle);
      setVehicles(prev => [vehicle, ...prev]);
      setNewVehicle({
        plate_number: '',
        vehicle_type: '4-wheeler',
        location_id: locations[0]?.id || '',
        contractor_id: locations[0]?.contractor_id || '',
        mobile_number: ''
      });
      setShowAddVehicle(false);
      setShowConfirmCheckin(false);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Error adding vehicle: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowConfirmDialog(true);
  };

  const handleConfirmCheckout = () => {
    setShowConfirmDialog(false);
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = async (data: { payment_amount: number; payment_method: string }) => {
    if (!selectedVehicle) return;

    try {
      setLoading(true);
      const checkoutData = {
        check_out_time: new Date().toISOString(),
        payment_amount: data.payment_amount,
        payment_method: data.payment_method as 'cash' | 'card' | 'digital' | 'free'
      };
      
      const updatedVehicle = await VehicleAPI.checkoutVehicle(selectedVehicle.id, checkoutData);
      setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? updatedVehicle : v));
      
      // Calculate duration
      const checkInTime = new Date(selectedVehicle.check_in_time);
      const checkOutTime = new Date();
      const durationMs = checkOutTime.getTime() - checkInTime.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      const duration = `${hours}h ${minutes}m ${seconds}s`;
      
      // Set checkout details for success dialog
      setCheckoutDetails({
        paymentAmount: data.payment_amount,
        paymentMethod: data.payment_method,
        duration: duration
      });
      
      // Close checkout dialog and show success dialog
      setShowCheckout(false);
      setShowSuccessDialog(true);
      // Don't clear selectedVehicle yet - let success dialog use it
    } catch (error) {
      console.error('Error checking out vehicle:', error);
      alert('Error checking out vehicle: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    try {
      setProcessingImage(true);
      const plateNumber = await OCRService.processPlateImage(imageData);
      setNewVehicle(prev => ({ ...prev, plate_number: plateNumber }));
      setShowCamera(false);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setProcessingImage(false);
    }
  };
  // Add a simple fallback for debugging
  if (!profile) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Loading Profile...</h3>
        <p className="text-muted-foreground">Please wait while we load your profile.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Debug information
  console.log('Vehicles component - Profile loaded:', {
    role: profile.role,
    id: profile.id,
    status: profile.status,
    loading: loading,
    vehiclesCount: vehicles.length,
    isSuperAdmin,
    isAttendant,
    isContractor
  });

  // Add a simple test to see if the component is rendering
  console.log('Vehicles component is rendering with vehicles:', vehicles);
  console.log('allVehicles after filtering:', allVehicles);
  console.log('currentlyParkedVehicles:', currentlyParkedVehicles);
  console.log('checkedOutVehicles:', checkedOutVehicles);

  // Block access if subscription is expired
  if (subscriptionBlocked) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Blocked</h2>
          <p className="text-muted-foreground mb-4">
            Your contractor's subscription has expired. Please contact your contractor to recharge.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vehicle Logs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View all vehicle activity from your locations with assigned attendants.
          </p>
        </div>
        {isAttendant && (
          <Button onClick={() => setShowAddVehicle(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Vehicles"
          value={stats.totalVehicles}
          description="All time"
          icon={Car}
          variant="info"
        />
        <MetricCard
          title="Currently Parked"
          value={stats.currentlyParked}
          description="Active sessions"
          icon={MapPin}
          variant="warning"
        />
        <MetricCard
          title="Average Duration"
          value={`${stats.averageDuration}h`}
          description="Per session"
          icon={Clock}
          variant="default"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue}`}
          description="From vehicles"
          icon={Banknote}
          variant="success"
        />
      </div>

      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search vehicles by plate number, location, mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="text-gray-500 w-full sm:w-auto"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Vehicles</TabsTrigger>
          <TabsTrigger value="parked" className="text-xs sm:text-sm">Currently Parked</TabsTrigger>
          <TabsTrigger value="checked-out" className="text-xs sm:text-sm">Checked Out</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading vehicles...</div>
            </div>
          ) : allVehicles.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
              <p className="text-muted-foreground">
                {isContractor 
                  ? "Vehicle logs will appear here when attendants check in vehicles at your assigned locations."
                  : "Vehicle logs will appear here when vehicles check in."
                }
              </p>
            </div>
          ) : (
            renderVehicleTable(allVehicles)
          )}
        </TabsContent>
        
        <TabsContent value="parked" className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading vehicles...</div>
            </div>
          ) : currentlyParkedVehicles.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No parked vehicles</h3>
              <p className="text-muted-foreground">Currently parked vehicles will appear here.</p>
            </div>
          ) : (
            renderVehicleTable(currentlyParkedVehicles)
          )}
        </TabsContent>
        
        <TabsContent value="checked-out" className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading vehicles...</div>
            </div>
          ) : checkedOutVehicles.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No checked out vehicles</h3>
              <p className="text-muted-foreground">Checked out vehicles will appear here.</p>
            </div>
          ) : (
            renderVehicleTable(checkedOutVehicles)
          )}
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Dialog */}
      {isAttendant && (
        <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
          <DialogContent className="max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold">Vehicle Check-in</DialogTitle>
              <DialogDescription className="text-sm">
                Enter vehicle details to check-in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {/* Vehicle Type Selection */}
              <div>
                <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Vehicle Type</Label>
                <RadioGroup
                  value={newVehicle.vehicle_type}
                  onValueChange={(value: '2-wheeler' | '4-wheeler') => 
                    setNewVehicle(prev => ({ ...prev, vehicle_type: value }))
                  }
                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2-wheeler" id="2-wheeler" />
                    <Label htmlFor="2-wheeler" className="flex items-center space-x-2 cursor-pointer">
                      <Bike className="h-5 w-5" />
                      <span>2-Wheeler</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4-wheeler" id="4-wheeler" />
                    <Label htmlFor="4-wheeler" className="flex items-center space-x-2 cursor-pointer">
                      <CarIcon className="h-5 w-5" />
                      <span>4-Wheeler</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Plate Number Input */}
              <div>
                <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Plate Number</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    value={newVehicle.plate_number}
                    onChange={(e) => {
                      const input = e.target;
                      const cursorPosition = input.selectionStart;
                      const newValue = e.target.value.toUpperCase();
                      setNewVehicle(prev => ({ ...prev, plate_number: newValue }));
                      // Restore cursor position after state update
                      setTimeout(() => {
                        input.setSelectionRange(cursorPosition, cursorPosition);
                      }, 0);
                    }}
                    placeholder="e.g., ABC-1234"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCamera(true)}
                    disabled={processingImage}
                    className="w-full sm:w-auto"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                {processingImage && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Processing image...
                  </p>
                )}
              </div>

              {/* Mobile Number Input */}
              <div>
                <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Mobile Number (Optional)</Label>
                <Input
                  value={newVehicle.mobile_number || ''}
                  onChange={(e) => {
                    const input = e.target;
                    const cursorPosition = input.selectionStart;
                    const newValue = e.target.value.toUpperCase();
                    setNewVehicle(prev => ({ ...prev, mobile_number: newValue }));
                    // Restore cursor position after state update
                    setTimeout(() => {
                      input.setSelectionRange(cursorPosition, cursorPosition);
                    }, 0);
                  }}
                  placeholder="e.g., +91 9876543210"
                  type="tel"
                />
              </div>

              {/* Location Display */}
              <div>
                <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Location</Label>
                <Input
                  value={locations[0]?.locations_name || 'Loading...'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is your assigned location
                </p>
              </div>

              {/* Live Occupancy */}
              <div>
                <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Live Occupancy</Label>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stats.currentlyParked / Math.max(stats.totalVehicles, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    {stats.currentlyParked}/{Math.max(stats.totalVehicles, 100)} spots occupied
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                <Button variant="outline" onClick={() => setShowAddVehicle(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddVehicle} 
                  disabled={loading || !newVehicle.plate_number}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                  {loading ? 'Adding...' : 'Check-in'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Confirm Checkout Dialog */}
      <ConfirmCheckoutDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedVehicle(null);
        }}
        onConfirm={handleConfirmCheckout}
        vehicle={selectedVehicle}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false);
          setSelectedVehicle(null);
        }}
        onConfirm={handleCheckoutConfirm}
        vehicle={selectedVehicle}
        contractorRates={contractorRates}
        loading={loading}
      />

      {/* Checkout Success Dialog */}
      <CheckoutSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          setCheckoutDetails(null);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        paymentAmount={checkoutDetails?.paymentAmount || 0}
        paymentMethod={checkoutDetails?.paymentMethod || ''}
        duration={checkoutDetails?.duration || ''}
      />

      {/* Confirm Check-in Dialog */}
      <ConfirmCheckinDialog
        isOpen={showConfirmCheckin}
        onClose={() => {
          setShowConfirmCheckin(false);
        }}
        onConfirm={handleConfirmCheckin}
        vehicle={{
          id: '',
          plate_number: newVehicle.plate_number,
          vehicle_type: newVehicle.vehicle_type,
          mobile_number: newVehicle.mobile_number,
          location: locations.find(loc => loc.id === newVehicle.location_id)
        }}
        loading={loading}
      />
    </div>
  );
}
