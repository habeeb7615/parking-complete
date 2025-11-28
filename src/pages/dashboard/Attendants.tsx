import { useEffect, useMemo, useState, useRef, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Users, Plus, MapPin, Clock, CheckCircle, Search, ArrowUpDown, Edit, Trash2, X, Eye, EyeOff } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useToast } from "@/hooks/use-toast";
import { AttendantAPI, type Attendant, type PaginatedResponse, type PaginationParams } from "@/services/attendantApi";
import { SuperAdminAPI, type CreateAttendantData } from "@/services/superAdminApi";
import { ContractorAPI } from "@/services/contractorApi";
import { useAuth } from "@/contexts/AuthContext";
import { LocationAPI } from "@/services/locationApi";

const Attendants = memo(function Attendants() {
  const { profile, user } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const isContractor = profile?.role === "contractor";
  const isAttendant = profile?.role === "attendant";
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Attendant | null>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [contractorData, setContractorData] = useState<any>(null); // For contractor limit checking
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<Partial<CreateAttendantData>>({
    user_name: "",
    email: "",
    password: "",
    phone_number: "",
    location_id: "none",
    contractor_id: "",
    status: "active",
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortBy, setSortBy] = useState("created_on");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Track if data has been fetched to prevent unnecessary re-fetches
  const dataFetchedRef = useRef(false);
  
  const { toast } = useToast();

  const stats = useMemo(() => {
    return {
      totalAttendants: pagination.totalCount,
      activeAttendants: attendants.filter(a => a.status === 'active').length,
      assignedLocations: attendants.filter(a => a.location_id).length,
      averageHours: 0 // This would be calculated from actual work data
    };
  }, [attendants, pagination.totalCount]);

  const fetchData = async (page = pagination.page, searchTerm = search, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true);
      console.log('Fetching data...', { page, searchTerm, sort, order });
      
      const params: PaginationParams = {
        page,
        pageSize: pagination.pageSize,
        search: searchTerm,
        sortBy: sort,
        sortOrder: order
      };
      
      console.log('Fetching attendants with params:', params);
      
      let attendantsResult;
      
      // Use different API based on user role
      if (profile?.role === 'contractor' && user?.id) {
        // For contractors, only show attendants assigned to their locations
        // Try to get contractor data from localStorage first
        const { AuthAPI } = await import('@/services/authApi');
        let contractor = AuthAPI.getContractor();
        
        // If not in localStorage, fetch it
        if (!contractor) {
          try {
            contractor = await ContractorAPI.getContractorByUserId(user.id);
            if (contractor) {
              AuthAPI.setContractor(contractor);
            }
          } catch (error) {
            console.error('Failed to fetch contractor data:', error);
            contractor = null;
          }
        } else {
          // Update state with localStorage data
          setContractorData(contractor);
        }
        
        const attendantsData = await AttendantAPI.getAttendantsByContractor(user.id, params);
        attendantsResult = attendantsData;
        setContractorData(contractor);
      } else if (profile?.role === 'attendant' && user?.id) {
        // For attendants, only show their own information
        attendantsResult = await AttendantAPI.getAttendantByUserId(user.id);
        // Convert single attendant to paginated format
        attendantsResult = {
          data: attendantsResult ? [attendantsResult] : [],
          count: attendantsResult ? 1 : 0,
          page: 1,
          pageSize: 1,
          totalPages: 1
        };
      } else {
        // For super admins, show all attendants
        attendantsResult = await AttendantAPI.getAllAttendants(params);
      }
      
      // Fetch contractors and locations based on role
      let consPromise, locsPromise;
      
      if (isContractor && user?.id) {
        // For contractors, only fetch their own locations
        consPromise = Promise.resolve([]); // Contractors don't need contractor list
        locsPromise = LocationAPI.getContractorLocations(user.id);
      } else {
        // For super admin, fetch all
        consPromise = SuperAdminAPI.getAllContractors();
        locsPromise = LocationAPI.getAllLocations();
      }
      
      const [cons, locs] = await Promise.all([consPromise, locsPromise]);
      
      console.log('Attendants result:', attendantsResult);
      console.log('Contractors:', cons);
      console.log('Locations:', locs);
      
      setAttendants(attendantsResult.data);
      setContractors(cons);
      setLocations(locs);
      setPagination(prev => ({
        ...prev,
        page: attendantsResult.page,
        totalPages: attendantsResult.totalPages,
        totalCount: attendantsResult.count
      }));
    } catch (e: any) {
      console.error('Error fetching data:', e);
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to load attendants" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (profile && user && !dataFetchedRef.current) {
      console.log('Attendants: Initial data fetch triggered');
      dataFetchedRef.current = true;
      fetchData(); 
    }
  }, [profile?.role, user?.id]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        handleSearch(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchData(page, search, sortBy, sortOrder);
  };

  const handleSearch = async (searchTerm: string) => {
    setSearch(searchTerm);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchLoading(true);
    try {
      await fetchData(1, searchTerm, sortBy, sortOrder);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData(1, search, field, newOrder);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
    fetchData(1, search, sortBy, sortOrder);
  };

  const openCreate = async () => {
    setEditing(null);
    
    // For contractors, get contractor_id from localStorage
    let initialContractorId = "";
    if (isContractor && user) {
      // Try to get from localStorage first
      const { AuthAPI } = await import('@/services/authApi');
      const storedContractor = AuthAPI.getContractor();
      
      if (storedContractor && storedContractor.id) {
        initialContractorId = storedContractor.id;
        setContractorData(storedContractor);
      } else if (contractorData && contractorData.id) {
        // Fallback to state if localStorage doesn't have it
        initialContractorId = contractorData.id;
      } else {
        // Fetch if not available
        try {
          const contractor = await ContractorAPI.getContractorByUserId(user.id);
          if (contractor && contractor.id) {
            initialContractorId = contractor.id;
            setContractorData(contractor);
          }
        } catch (error) {
          console.error('Failed to fetch contractor data:', error);
        }
      }
    }
    
    setForm({ 
      user_name: "", 
      email: "", 
      password: "", 
      phone_number: "", 
      location_id: "none", 
      contractor_id: initialContractorId,
      status: "active"
    });
    setShowForm(true);
  };

  const openEdit = (attendant: Attendant) => {
    setEditing(attendant);
    setForm({
      user_name: attendant.profiles?.user_name || "",
      email: attendant.profiles?.email || "",
      phone_number: attendant.profiles?.phone_number || "",
      location_id: attendant.location_id || "none",
      contractor_id: attendant.parking_locations?.contractors?.company_name ? 
        contractors.find(c => c.company_name === attendant.parking_locations?.contractors?.company_name)?.id || "" : "",
      status: (attendant.status === 'active' || attendant.status === 'inactive') ? attendant.status : 'active'
    });
    setShowForm(true);
  };

  const save = async () => {
    try {
      if (!form.user_name || !form.email) {
        toast({ variant: "destructive", title: "Validation", description: "Please fill all required fields" });
        return;
      }
      
      // For contractors, ensure contractor_id is set from localStorage
      if (isContractor && user && !form.contractor_id) {
        const { AuthAPI } = await import('@/services/authApi');
        const storedContractor = AuthAPI.getContractor();
        
        if (storedContractor && storedContractor.id) {
          setForm({ ...form, contractor_id: storedContractor.id });
        } else if (contractorData && contractorData.id) {
          setForm({ ...form, contractor_id: contractorData.id });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Contractor information not found. Please refresh the page." });
          return;
        }
      }
      
      if (!form.contractor_id) {
        toast({ variant: "destructive", title: "Validation", description: "Contractor is required" });
        return;
      }
      
      setFormLoading(true);
      
      // Convert "none" back to empty string for the API
      const formData = {
        ...form,
        location_id: form.location_id === "none" ? "" : form.location_id
      };
      
      // Check limit for contractors before creating (if location is specified)
      if (isContractor && user && !editing && formData.location_id) {
        // Get contractor data from localStorage or state
        const { AuthAPI } = await import('@/services/authApi');
        const storedContractor = AuthAPI.getContractor() || contractorData;
        
        if (storedContractor) {
          const attendantsAtLocation = attendants.filter(a => a.location_id === formData.location_id).length;
          const allowedPerLocation = storedContractor.allowed_attendants_per_location || 0;
          if (attendantsAtLocation >= allowedPerLocation) {
            toast({ 
              variant: "destructive", 
              title: "Limit Reached", 
              description: `You have reached the maximum limit of ${allowedPerLocation} attendants per location. Please contact admin to increase your limit.` 
            });
            setFormLoading(false);
            return;
          }
        }
      }
      
      if (editing) {
        console.log('Updating attendant with data:', formData);
        const updatedAttendant = await SuperAdminAPI.updateAttendant(editing.id, formData as CreateAttendantData);
        console.log('Updated attendant result:', updatedAttendant);
        toast({ title: "Updated", description: "Attendant updated" });
      } else {
        if (!form.password) {
          toast({ variant: "destructive", title: "Validation", description: "Password is required for new attendants" });
          setFormLoading(false);
          return;
        }
        console.log('Creating attendant with data:', formData);
        await SuperAdminAPI.createAttendant(formData as CreateAttendantData);
        toast({ title: "Created", description: "Attendant created successfully" });
      }
      setShowForm(false);
      setEditing(null);
      console.log('Refreshing data after update...');
      await fetchData();
    } catch (e: any) {
      console.error('Error saving attendant:', e);
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to save" });
    } finally {
      setFormLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await SuperAdminAPI.deleteAttendant(id);
      toast({ title: "Deleted", description: "Attendant deleted" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to delete" });
    } finally {
      setDeletingId(null);
    }
  };

  // Get contractor data from localStorage or state
  const currentContractor = useMemo(() => {
    if (isContractor && user) {
      try {
        const { AuthAPI } = require('@/services/authApi');
        return AuthAPI.getContractor() || contractorData;
      } catch {
        return contractorData;
      }
    }
    return contractorData;
  }, [isContractor, user, contractorData]);

  // Filter locations by selected contractor
  const filteredLocations = useMemo(() => {
    if (isContractor && currentContractor) {
      // For contractors, only show their own locations
      return locations.filter(loc => loc.contractor_id === currentContractor.id);
    }
    if (!form.contractor_id) return [];
    return locations.filter(loc => loc.contractor_id === form.contractor_id);
  }, [form.contractor_id, locations, isContractor, currentContractor]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendants</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'attendant' 
              ? 'View your profile and assignment details'
              : 'Manage on-site staff and their assignments'
            }
          </p>
        </div>
        {(isSuperAdmin || isContractor) && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Attendant
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Attendants"
          value={stats.totalAttendants}
          description="Registered staff"
          icon={Users}
          variant="info"
        />
        <MetricCard
          title="Active Attendants"
          value={stats.activeAttendants}
          description="Currently working"
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Assigned Locations"
          value={stats.assignedLocations}
          description="Active assignments"
          icon={MapPin}
          variant="warning"
        />
        <MetricCard
          title="Average Hours"
          value={`${stats.averageHours}h`}
          description="Per day"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Attendants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {profile?.role === 'attendant' ? 'Your Profile' : 'Attendant List'}
                {search && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Search results for "{search}")
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {profile?.role === 'attendant' 
                  ? 'View your profile and assignment details'
                  : 'View and manage all staff members'
                }
              </CardDescription>
            </div>
            {profile?.role !== 'attendant' && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search attendants..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 pr-8 w-full sm:w-64"
                    disabled={searchLoading}
                  />
                  {searchLoading ? (
                    <div className="absolute right-2 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  ) : searchInput ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchInput("");
                        handleSearch("");
                      }}
                      className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={pagination.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-parkflow-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading attendants...</p>
            </div>
          ) : attendants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No attendants found</h3>
              {!isSuperAdmin && (
                <p className="text-muted-foreground">Your account has no attendants yet.</p>
              )}
              {(isSuperAdmin || isContractor) && (
                <>
                  <p className="text-muted-foreground mb-4">Get started by adding your first attendant</p>
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Attendant
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('profiles.user_name')}
                        className="h-auto p-0 font-semibold"
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('profiles.email')}
                        className="h-auto p-0 font-semibold"
                      >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="h-auto p-0 font-semibold"
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    {(isSuperAdmin || isContractor) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendants.map(attendant => (
                    <TableRow key={attendant.id}>
                      <TableCell className="font-medium">{attendant.profiles?.user_name || '-'}</TableCell>
                      <TableCell>{attendant.profiles?.email || '-'}</TableCell>
                      <TableCell>{attendant.profiles?.phone_number || '-'}</TableCell>
                      <TableCell>{attendant.parking_locations?.locations_name || 'Not assigned'}</TableCell>
                      <TableCell>{attendant.parking_locations?.contractors?.company_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={attendant.status === 'active' ? 'default' : 'secondary'}>
                          {attendant.status || 'inactive'}
                        </Badge>
                      </TableCell>
                      {(isSuperAdmin || isContractor) && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(attendant)} disabled={deletingId !== null}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => remove(attendant.id)}
                              disabled={deletingId !== null}
                            >
                              {deletingId === attendant.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination - Always show for debugging */}
          {profile?.role !== 'attendant' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t bg-gray-50/50">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
                <br />
                <span className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} | Page Size: {pagination.pageSize}
                </span>
              </div>
              {pagination.totalPages > 1 && (
                <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pagination.page === pageNum}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Attendant Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Attendant" : "Add Attendant"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update attendant information" : "Create a new attendant account"}
              {isContractor && currentContractor && !editing && form.location_id && form.location_id !== "none" && (() => {
                const attendantsAtLocation = attendants.filter(a => a.location_id === form.location_id).length;
                return (
                  <span className="block mt-1 text-xs">
                    Attendants at this location: {attendantsAtLocation} / {currentContractor.allowed_attendants_per_location || 0} allowed
                    {attendantsAtLocation >= (currentContractor.allowed_attendants_per_location || 0) && (
                      <span className="text-red-500 ml-2">(Limit reached for this location)</span>
                    )}
                  </span>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_name">Full Name *</Label>
              <Input 
                id="user_name" 
                value={form.user_name || ""} 
                onChange={e => setForm({ ...form, user_name: e.target.value })} 
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={form.email || ""} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input 
                id="phone_number" 
                value={form.phone_number || ""} 
                onChange={e => setForm({ ...form, phone_number: e.target.value })} 
                placeholder="Enter phone number"
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={form.password || ""} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            {isSuperAdmin && (
              <div className="space-y-2 md:col-span-2">
                <Label>Contractor *</Label>
                <Select value={form.contractor_id || ""} onValueChange={(value) => setForm({ ...form, contractor_id: value, location_id: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No contractors found</div>
                    ) : (
                      contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name || c.profiles?.user_name || c.profiles?.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isContractor && currentContractor && (
              <div className="space-y-2 md:col-span-2">
                <Label>Contractor</Label>
                <Input 
                  value={currentContractor.company_name || currentContractor.profiles?.user_name || "Your Account"} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Assigned Location</Label>
              <Select value={form.location_id || "none"} onValueChange={(value) => setForm({ ...form, location_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location assigned</SelectItem>
                  {filteredLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.locations_name} - {loc.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.contractor_id && filteredLocations.length === 0 && (
                <p className="text-sm text-muted-foreground">No locations available for selected contractor</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status || "active"} onValueChange={(value) => setForm({ ...form, status: value as 'active' | 'inactive' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button onClick={save} disabled={formLoading}>
              {formLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editing ? "Updating..." : "Creating..."}
                </>
              ) : (
                editing ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default Attendants;
