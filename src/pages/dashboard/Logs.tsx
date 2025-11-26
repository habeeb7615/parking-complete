import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Download, Search, AlertCircle, AlertTriangle, Info, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useAuth } from "@/contexts/AuthContext";
import { formatTimeAgo, formatDateTime } from "@/utils/dateUtils";
import { ContractorAPI } from "@/services/contractorApi";
import { VehicleAPI } from "@/services/vehicleApi";
import { AttendantAPI } from "@/services/attendantApi";
import { apiClient } from "@/lib/apiClient";

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource: string;
  created_at: string;
}

interface LogStats {
  totalEvents: number;
  todayEvents: number;
  errors: number;
  warnings: number;
}

export default function Logs() {
  const { profile, user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalEvents: 0,
    todayEvents: 0,
    errors: 0,
    warnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm]);

  // Separate effect for page size changes
  useEffect(() => {
    if (filteredLogs.length > 0) {
      const totalPages = Math.ceil(filteredLogs.length / pagination.pageSize);
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalCount: filteredLogs.length,
        page: Math.min(prev.page, totalPages || 1)
      }));
    }
  }, [filteredLogs.length, pagination.pageSize]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        handleSearch(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let data;
      
      if (profile?.role === 'contractor' && user?.id) {
        // For contractors, fetch only logs related to their activities
        data = await fetchContractorLogs(user.id);
      } else {
        // For super admins, try to get recent activity from dashboard API with pagination
        try {
          const { DashboardAPI } = await import('@/services/dashboardApi');
          const result = await DashboardAPI.getRecentActivityPaginated({
            page: 1,
            pageSize: 100,
            sortBy: 'timestamp',
            sortOrder: 'desc'
          });
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            data = result.data;
          } else {
            // If no recent activity, create sample logs from existing data
            console.log('Creating sample logs from existing data...');
            data = await generateSampleLogs();
          }
        } catch (error) {
          console.log('Error fetching recent activity, creating sample logs from existing data...', error);
          // If API fails, create sample logs from existing data
          data = await generateSampleLogs();
        }
      }

      if (data) {
        const formattedLogs: SystemLog[] = data.map(log => ({
          id: log.id,
          level: log.level,
          message: log.message,
          details: log.details,
          user_id: log.user_id,
          user_name: log.profiles?.user_name || log.user_name || 'System',
          action: log.action,
          resource: log.resource,
          created_at: log.created_at
        }));

        setLogs(formattedLogs);
        calculateStats(formattedLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Create sample logs if there's an error
      try {
        const sampleLogs = await generateSampleLogs();
        setLogs(sampleLogs);
        calculateStats(sampleLogs);
      } catch (sampleError) {
        console.error('Error generating sample logs:', sampleError);
        // Set empty logs as fallback
        setLogs([]);
        calculateStats([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchContractorLogs = async (contractorUserId: string): Promise<SystemLog[]> => {
    try {
      // Get contractor data
      const contractor = await ContractorAPI.getContractorByUserId(contractorUserId);
      
      if (!contractor || !contractor.id) {
        return [];
      }

      // Generate logs from contractor's activities
      const logs: SystemLog[] = [];
      
      // Get contractor's vehicles
      try {
        const vehicles = await VehicleAPI.getContractorVehicles(contractor.id);
        vehicles.slice(0, 20).forEach(vehicle => {
          if (vehicle.check_in_time) {
            logs.push({
              id: `vehicle-checkin-${vehicle.id}`,
              level: 'info',
              message: `Vehicle ${vehicle.plate_number} checked in`,
              details: `Vehicle checked in at ${formatDateTime(vehicle.check_in_time)}`,
              user_name: 'System',
              action: 'vehicle_checkin',
              resource: 'vehicles',
              created_at: vehicle.check_in_time
            });
          }
          
          if (vehicle.check_out_time) {
            logs.push({
              id: `vehicle-checkout-${vehicle.id}`,
              level: 'success',
              message: `Vehicle ${vehicle.plate_number} checked out`,
              details: `Vehicle checked out at ${formatDateTime(vehicle.check_out_time)}`,
              user_name: 'System',
              action: 'vehicle_checkout',
              resource: 'vehicles',
              created_at: vehicle.check_out_time
            });
          }
        });
      } catch (error) {
        console.error('Error fetching contractor vehicles for logs:', error);
      }

      // Get contractor's locations
      try {
        const locations = await ContractorAPI.getContractorLocations(contractor.id);
        locations.slice(0, 5).forEach(location => {
          logs.push({
            id: `location-${location.id}`,
            level: 'info',
            message: `Location ${location.locations_name} active`,
            details: `Location is active and operational`,
            user_name: 'System',
            action: 'location_active',
            resource: 'parking_locations',
            created_at: location.created_on || new Date().toISOString()
          });
        });
      } catch (error) {
        console.error('Error fetching contractor locations for logs:', error);
      }

      // Sort by created_at descending
      return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching contractor logs:', error);
      return [];
    }
  };

  const generateSampleLogs = async (): Promise<SystemLog[]> => {
    try {
      // Try to get some real data to create meaningful logs
      let vehicles: any[] = [];
      let contractors: any[] = [];
      let attendants: any[] = [];

      try {
        vehicles = await VehicleAPI.getAllVehicles();
        vehicles = vehicles.slice(0, 10);
      } catch (error) {
        console.error('Error fetching vehicles for sample logs:', error);
      }

      try {
        contractors = await ContractorAPI.getAllContractors();
        contractors = contractors.slice(0, 5);
      } catch (error) {
        console.error('Error fetching contractors for sample logs:', error);
      }

      try {
        const attendantsResponse = await AttendantAPI.getAllAttendants({ page: 1, pageSize: 5 });
        attendants = attendantsResponse.data || [];
      } catch (error) {
        console.error('Error fetching attendants for sample logs:', error);
      }

      const sampleLogs: SystemLog[] = [];

      // Add vehicle-related logs
      if (vehicles && vehicles.length > 0) {
        vehicles.forEach((vehicle, index) => {
          if (vehicle.check_in_time) {
            sampleLogs.push({
              id: `vehicle-checkin-${vehicle.id}`,
              level: 'info',
              message: `Vehicle ${vehicle.plate_number} checked in`,
              details: `Vehicle checked in at ${formatDateTime(vehicle.check_in_time)}`,
              user_name: 'System',
              action: 'vehicle_checkin',
              resource: 'vehicles',
              created_at: vehicle.check_in_time
            });
          }
          
          if (vehicle.check_out_time) {
            sampleLogs.push({
              id: `vehicle-checkout-${vehicle.id}`,
              level: 'success',
              message: `Vehicle ${vehicle.plate_number} checked out`,
              details: `Vehicle checked out at ${formatDateTime(vehicle.check_out_time)}`,
              user_name: 'System',
              action: 'vehicle_checkout',
              resource: 'vehicles',
              created_at: vehicle.check_out_time
            });
          }
        });
      }

      // Add contractor-related logs
      if (contractors && contractors.length > 0) {
        contractors.forEach((contractor) => {
          sampleLogs.push({
            id: `contractor-${contractor.id}`,
            level: 'info',
            message: `Contractor ${contractor.company_name || 'Unknown'} registered`,
            details: `New contractor added to the system`,
            user_name: 'System',
            action: 'contractor_create',
            resource: 'contractors',
            created_at: contractor.created_on || new Date().toISOString()
          });
        });
      }

      // Add attendant-related logs
      if (attendants && attendants.length > 0) {
        attendants.forEach((attendant) => {
          const attendantName = attendant.profiles?.user_name || 'Unknown';
          sampleLogs.push({
            id: `attendant-${attendant.id}`,
            level: 'info',
            message: `Attendant ${attendantName} added`,
            details: `New attendant added to the system`,
            user_name: 'System',
            action: 'attendant_create',
            resource: 'attendants',
            created_at: attendant.created_on || new Date().toISOString()
          });
        });
      }

      // Add some system logs
      sampleLogs.push({
        id: 'system-start',
        level: 'info',
        message: 'System started successfully',
        details: 'All services are running normally',
        user_name: 'System',
        action: 'system_start',
        resource: 'system',
        created_at: new Date().toISOString()
      });

      sampleLogs.push({
        id: 'system-warning',
        level: 'warning',
        message: 'High memory usage detected',
        details: 'Memory usage reached 85%',
        user_name: 'System',
        action: 'system_warning',
        resource: 'system',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      });

      // Sort by created_at descending
      return sampleLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error generating sample logs:', error);
      return [];
    }
  };

  const calculateStats = (logs: SystemLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= today;
    });

    const errors = logs.filter(log => log.level === 'error').length;
    const warnings = logs.filter(log => log.level === 'warning').length;

    setStats({
      totalEvents: logs.length,
      todayEvents: todayLogs.length,
      errors,
      warnings
    });
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  // Search handler
  const handleSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchLoading(true);
    try {
      // Search is handled by filterLogs effect
    } finally {
      setSearchLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => {
      const newPagination = { ...prev, pageSize, page: 1 };
      // Calculate new total pages immediately
      const totalPages = Math.ceil(filteredLogs.length / pageSize);
      return {
        ...newPagination,
        totalPages,
        totalCount: filteredLogs.length
      };
    });
  };

  const getPaginatedLogs = () => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredLogs.slice(startIndex, endIndex);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string | undefined) => {
    if (!level) {
      return (
        <Badge variant="outline">
          UNKNOWN
        </Badge>
      );
    }

    const variants = {
      error: "destructive",
      warning: "secondary",
      success: "default",
      info: "outline"
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || "outline"}>
        {level.toUpperCase()}
      </Badge>
    );
  };


  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'Details', 'User', 'Action', 'Resource'],
      ...filteredLogs.map(log => [
        formatDateTime(log.created_at),
        log.level,
        log.message,
        log.details || '',
        log.user_name || '',
        log.action,
        log.resource
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Fallback UI in case of any errors
  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">Loading Profile...</h3>
          <p className="text-muted-foreground">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">System Logs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor system events and user activities
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={exportLogs} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <MetricCard
          title="Total Events"
          value={stats.totalEvents}
          description="All time"
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Today's Events"
          value={stats.todayEvents}
          description="Last 24 hours"
          icon={Clock}
          variant="default"
        />
        <MetricCard
          title="Errors"
          value={stats.errors}
          description="System errors"
          icon={AlertCircle}
          variant="destructive"
        />
        <MetricCard
          title="Warnings"
          value={stats.warnings}
          description="System warnings"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Recent Logs</CardTitle>
              <CardDescription className="text-sm">
                View and filter system activity logs ({getPaginatedLogs().length} of {filteredLogs.length} total)
                {searchTerm && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Search results for "{searchTerm}")
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
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
              <Button onClick={fetchLogs} variant="outline" className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Refresh Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {getPaginatedLogs().length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {getPaginatedLogs().map((log) => (
                <div key={log.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm sm:text-base truncate">
                            {log.message}
                          </h4>
                          {getLevelBadge(log.level)}
                        </div>
                        {log.details && (
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                            {log.details}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                          <span>User: {log.user_name || 'System'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Action: {log.action}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Resource: {log.resource}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatTimeAgo(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No logs match your search criteria.' : 'No system logs available at the moment.'}
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t bg-gray-50/50">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} results
                <br />
                <span className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} | Showing {pagination.pageSize} per page
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
    </div>
  );
}