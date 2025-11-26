import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Building, Plus, Users, MapPin, Banknote, Search, ArrowUpDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { SuperAdminAPI } from '@/services/superAdminApi';
import { ContractorForm } from '@/components/contractors/ContractorForm';
import { ContractorsList } from '@/components/contractors/ContractorsList';
import { MetricCard } from '@/components/dashboard/MetricCard';

interface ContractorStats {
  totalContractors: number;
  totalLocations: number;
  totalAttendants: number;
  totalRevenue: number;
}

export default function Contractors() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [stats, setStats] = useState<ContractorStats>({
    totalContractors: 0,
    totalLocations: 0,
    totalAttendants: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContractor, setEditingContractor] = useState<any>(null);
  
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

  const fetchContractors = async (page = pagination.page, searchTerm = search, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true);
      console.log('Fetching contractors...');
      const [contractorsResult, statsData] = await Promise.all([
        SuperAdminAPI.getPaginatedContractors({
          page,
          pageSize: pagination.pageSize,
          search: searchTerm,
          sortBy: sort,
          sortOrder: order
        }),
        SuperAdminAPI.getDashboardStats(),
      ]);
      
      console.log('Contractors data received:', contractorsResult);
      setContractors(contractorsResult.data);
      setPagination(prev => ({
        ...prev,
        page: contractorsResult.page,
        totalPages: contractorsResult.totalPages,
        totalCount: contractorsResult.count
      }));
      setStats({
        totalContractors: statsData.totalContractors,
        totalLocations: statsData.totalLocations,
        totalAttendants: statsData.totalAttendants,
        totalRevenue: statsData.totalRevenue,
      });
    } catch (error: any) {
      console.error('Error fetching contractors:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch contractors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchContractors(page, search, sortBy, sortOrder);
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchContractors(1, searchTerm, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchContractors(1, search, field, newOrder);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
    fetchContractors(1, search, sortBy, sortOrder);
  };

  const handleAddContractor = () => {
    setEditingContractor(null);
    setShowForm(true);
  };

  const handleEditContractor = (contractor: any) => {
    setEditingContractor(contractor);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContractor(null);
  };

  const handleFormSuccess = () => {
    console.log('Form success - refreshing contractors...');
    fetchContractors();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contractors</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage business partners and their operations
          </p>
        </div>
        <Button onClick={handleAddContractor} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Contractors"
          value={loading ? '...' : stats.totalContractors}
          description="Active partners"
          icon={Building}
          variant="info"
        />
        <MetricCard
          title="Total Locations"
          value={loading ? '...' : stats.totalLocations}
          description="Managed sites"
          icon={MapPin}
          variant="success"
        />
        <MetricCard
          title="Total Attendants"
          value={loading ? '...' : stats.totalAttendants}
          description="Staff members"
          icon={Users}
          variant="warning"
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${loading ? '...' : stats.totalRevenue.toFixed(2)}`}
          description="Lifetime earnings"
          icon={Banknote}
          variant="success"
        />
      </div>

      {/* Contractors List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Contractors List</CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage all contractors
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contractors..."
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
          <ContractorsList 
            contractors={contractors}
            onEdit={handleEditContractor}
            onRefresh={fetchContractors}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            loading={loading}
          />
          
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

      {/* Contractor Form Dialog */}
      <ContractorForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        contractor={editingContractor}
        isEditing={!!editingContractor}
      />
    </div>
  );
}
