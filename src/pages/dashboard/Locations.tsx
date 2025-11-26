import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { MapPin, Plus, Car, Users, Banknote, Edit, Trash2, Search, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationAPI, type Location, type CreateLocationData, type PaginatedResponse, type PaginationParams } from "@/services/locationApi";
import { SuperAdminAPI } from "@/services/superAdminApi";
import { ContractorAPI } from "@/services/contractorApi";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Locations() {
  const { profile, user } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const isContractor = profile?.role === "contractor";
  const [locations, setLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]); // contractor local cache
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [contractorData, setContractorData] = useState<any>(null); // For contractor limit checking
  const [form, setForm] = useState<Partial<CreateLocationData>>({
    locations_name: "",
    address: "",
    total_slots: 0,
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
  const [sortBy, setSortBy] = useState("created_on");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { toast } = useToast();


  const stats = useMemo(() => {
    const totalLocations = pagination.totalCount;
    const totalSlots = locations.reduce((s, l) => s + (l.total_slots || 0), 0);
    const occupied = locations.reduce((s, l) => s + (l.occupied_slots || 0), 0);
    const rate = totalSlots > 0 ? Math.round((occupied / totalSlots) * 100) : 0;
    return { totalLocations, totalSlots, occupied, rate };
  }, [locations, pagination.totalCount]);

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

  const fetchData = async (page = pagination.page, searchTerm = search, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const params: PaginationParams = {
          page,
          pageSize: pagination.pageSize,
          search: searchTerm,
          sortBy: sort,
          sortOrder: order
        };
        const [locsResult, cons] = await Promise.all([
          LocationAPI.getPaginatedLocations(params),
          SuperAdminAPI.getAllContractors(),
        ]);
        setLocations(locsResult.data);
        setContractors(cons);
        setPagination(prev => ({
          ...prev,
          page: locsResult.page,
          totalPages: locsResult.totalPages,
          totalCount: locsResult.count
        }));
      } else if (isContractor && user) {
        // Fetch locations assigned to this contractor and apply client-side filters
        const userId = user.id;
        console.log('Fetching locations for contractor user:', userId);
        
        // Try to get contractor data from localStorage first
        const { AuthAPI } = await import('@/services/authApi');
        let contractor = AuthAPI.getContractor();
        
        // If not in localStorage, fetch it
        if (!contractor) {
          try {
            contractor = await ContractorAPI.getContractorByUserId(userId);
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
        
        const result = await LocationAPI.getContractorLocations(userId);
        console.log('Contractor locations result:', result);
        console.log('Contractor data:', contractor);
        
        setAllLocations(result);
        setContractorData(contractor);
        applyLocalFilters(result, page, searchTerm, sort, order);
      } else {
        // default fallback (attendant/no role) - show empty list
        setLocations([]);
        setPagination(prev => ({ ...prev, page: 1, totalPages: 0, totalCount: 0 }));
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to load locations" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const applyLocalFilters = (source: Location[], page: number, searchTerm: string, sort: string, order: "asc" | "desc") => {
    let filtered = [...source];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.locations_name.toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q)
      );
    }
    // simple sort
    filtered.sort((a: any, b: any) => {
      const av = (a as any)[sort];
      const bv = (b as any)[sort];
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    });
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
    const start = (page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    setLocations(filtered.slice(start, end));
    setPagination(prev => ({ ...prev, page, totalPages, totalCount }));
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    if (isSuperAdmin) fetchData(page, search, sortBy, sortOrder);
    else applyLocalFilters(allLocations, page, search, sortBy, sortOrder);
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (isSuperAdmin) fetchData(1, searchTerm, sortBy, sortOrder);
    else applyLocalFilters(allLocations, 1, searchTerm, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (isSuperAdmin) fetchData(1, search, field, newOrder);
    else applyLocalFilters(allLocations, 1, search, field, newOrder);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
    if (isSuperAdmin) fetchData(1, search, sortBy, sortOrder);
    else applyLocalFilters(allLocations, 1, search, sortBy, sortOrder);
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
      locations_name: "", 
      address: "", 
      total_slots: 0, 
      contractor_id: initialContractorId, 
      status: "active" 
    });
    
    // Refresh contractor list for super admin
    if (isSuperAdmin) {
      SuperAdminAPI.getAllContractors().then(setContractors).catch(() => {});
    }
    
    setShowForm(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      locations_name: loc.locations_name,
      address: loc.address,
      total_slots: loc.total_slots,
      contractor_id: loc.contractor_id,
      status: loc.status,
    });
    setShowForm(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      
      if (!form.locations_name || !form.address) {
        toast({ variant: "destructive", title: "Validation", description: "Please fill all required fields" });
        setSaving(false);
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
          setSaving(false);
          return;
        }
      }
      
      if (!form.contractor_id) {
        toast({ variant: "destructive", title: "Validation", description: "Contractor is required" });
        setSaving(false);
        return;
      }
      
      // Check limit for contractors before creating
      if (isContractor && user && !editing) {
        // Get contractor data from localStorage or state
        const { AuthAPI } = await import('@/services/authApi');
        const storedContractor = AuthAPI.getContractor() || contractorData;
        
        if (storedContractor) {
          const currentCount = allLocations.length;
          const allowedCount = storedContractor.allowed_locations || 0;
          if (currentCount >= allowedCount) {
            toast({ 
              variant: "destructive", 
              title: "Limit Reached", 
              description: `You have reached the maximum limit of ${allowedCount} locations. Please contact admin to increase your limit.` 
            });
            setSaving(false);
            return;
          }
        }
      }
      
      if (editing) {
        await LocationAPI.updateLocation(editing.id, form as CreateLocationData);
        toast({ title: "Updated", description: "Location updated" });
      } else {
        await LocationAPI.createLocation(form as CreateLocationData);
        toast({ title: "Created", description: "Location created successfully" });
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await LocationAPI.deleteLocation(id);
      toast({ title: "Deleted", description: "Location deleted" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to delete" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Parking Locations</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage parking sites and their configurations
          </p>
        </div>
        {(isSuperAdmin || isContractor) && (
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Locations"
          value={stats.totalLocations}
          description="Active sites"
          icon={MapPin}
          variant="success"
        />
        <MetricCard
          title="Total Slots"
          value={stats.totalSlots}
          description="Available spaces"
          icon={Car}
          variant="info"
        />
        <MetricCard
          title="Occupied Slots"
          value={stats.occupied}
          description="Currently in use"
          icon={Users}
          variant="warning"
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${stats.rate}%`}
          description="Current utilization"
          icon={Banknote}
          variant={stats.rate > 80 ? "danger" : stats.rate > 60 ? "warning" : "success"}
        />
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Location List</CardTitle>
              <CardDescription>
                {isSuperAdmin ? "View and manage all parking locations" : "View your assigned parking locations"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={pagination.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-full sm:w-20">
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-parkflow-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading locations...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-3">No locations found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isSuperAdmin 
                  ? "Get started by adding your first parking location to manage your parking business."
                  : "Your account has no assigned locations yet. Contact your administrator or create sample data for testing."
                }
              </p>
              
              {(isSuperAdmin || isContractor) && (
                <Button onClick={openCreate} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Location
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('locations_name')}
                          className="h-auto p-0 font-semibold"
                        >
                          Location
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('address')}
                          className="h-auto p-0 font-semibold"
                        >
                          Address
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('total_slots')}
                          className="h-auto p-0 font-semibold"
                        >
                          Slots
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('occupied_slots')}
                          className="h-auto p-0 font-semibold"
                        >
                          Occupied
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
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
                    {locations.map(loc => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.locations_name}</TableCell>
                        <TableCell>{loc.address}</TableCell>
                        <TableCell>{loc.contractors?.company_name || '-'}</TableCell>
                        <TableCell>{loc.total_slots}</TableCell>
                        <TableCell>{loc.occupied_slots || 0}</TableCell>
                        <TableCell>
                          <Badge variant={loc.status === 'active' ? 'default' : 'secondary'}>{loc.status}</Badge>
                        </TableCell>
                        {(isSuperAdmin || isContractor) && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(loc)} disabled={deletingId !== null}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => remove(loc.id)}
                                disabled={deletingId !== null}
                              >
                                {deletingId === loc.id ? (
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

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {locations.map((loc) => (
                  <Card key={loc.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium text-sm">{loc.locations_name}</h3>
                            <p className="text-xs text-muted-foreground">{loc.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={loc.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {loc.status}
                          </Badge>
                          {(isSuperAdmin || isContractor) && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(loc)} disabled={deletingId !== null}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => remove(loc.id)}
                                disabled={deletingId !== null}
                              >
                                {deletingId === loc.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Contractor:</span>
                          <p className="font-medium">{loc.contractors?.company_name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Slots:</span>
                          <p className="font-medium">{loc.total_slots}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Occupied:</span>
                          <p className="font-medium">{loc.occupied_slots || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Available:</span>
                          <p className="font-medium">{(loc.total_slots || 0) - (loc.occupied_slots || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                          className="cursor-pointer"
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
                      className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {(isSuperAdmin || isContractor) && (
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editing ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription className="text-sm">
              {editing ? "Update parking location details" : "Configure parking location details"}
              {isContractor && currentContractor && !editing && (
                <span className="block mt-1 text-xs">
                  Locations: {allLocations.length} / {currentContractor.allowed_locations || 0} used
                  {allLocations.length >= (currentContractor.allowed_locations || 0) && (
                    <span className="text-red-500 ml-2">(Limit reached)</span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input id="name" value={form.locations_name || ""} onChange={e => setForm({ ...form, locations_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slots">Total Slots</Label>
              <Input id="slots" type="number" value={form.total_slots ?? 0} onChange={e => setForm({ ...form, total_slots: Number(e.target.value) })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>Contractor</Label>
                <Select value={form.contractor_id || ""} onValueChange={(v) => setForm({ ...form, contractor_id: v })}>
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
              <div className="space-y-2">
                <Label>Contractor</Label>
                <Input 
                  value={currentContractor.company_name || currentContractor.profiles?.user_name || "Your Account"} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  {editing ? "Updating..." : "Creating..."}
                </>
              ) : (
                editing ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
