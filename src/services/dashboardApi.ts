import { apiClient } from '@/lib/apiClient';
import { IPagination, IPaginatedResponse, convertToPaginationPayload } from '@/types/pagination.types';

export interface DashboardMetrics {
  totalContractors: number;
  totalLocations: number;
  activeAttendants: number;
  totalVehicles: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeSessions: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
}

export interface ContractorStats {
  id: string;
  company_name: string;
  total_locations: number;
  total_attendants: number;
  total_revenue: number;
  status: string;
  created_on: string;
}

export interface LocationStats {
  id: string;
  locations_name: string;
  address: string;
  total_slots: number;
  occupied_slots: number;
  occupancy_rate: number;
  daily_revenue: number;
  status: string;
}

export interface RecentActivity {
  id: string;
  type: 'vehicle_checkin' | 'vehicle_checkout' | 'contractor_registration' | 'attendant_login' | 'payment_received' | 'location_created';
  message: string;
  timestamp: string;
  metadata?: any;
}

export class DashboardAPI {
  // Get comprehensive dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return response.data;
  }

  // Get contractor statistics
  static async getContractorStats(): Promise<ContractorStats[]> {
    const response = await apiClient.get<ContractorStats[]>('/dashboard/contractor-stats');
    return response.data || [];
  }

  // Get location statistics
  static async getLocationStats(): Promise<LocationStats[]> {
    const response = await apiClient.get<LocationStats[]>('/dashboard/location-stats');
    return response.data || [];
  }

  // Get recent activity (legacy - uses limit parameter)
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/recent-activity', { limit });
    return response.data || [];
  }

  // Get recent activity with pagination
  static async getRecentActivityPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    type?: string;
  } = {}): Promise<{
    data: RecentActivity[];
    count: number;
    curPage: number;
    perPage: number;
    totalPages: number;
    page?: number;
    pageSize?: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'timestamp',
      sortOrder = 'desc',
      type = ''
    } = params;

    const whereClause: Array<{ key: string; value: string; operator?: string }> = [];

    // Add search to whereClause
    if (search) {
      whereClause.push({
        key: 'all',
        value: search,
        operator: 'LIKE'
      });
    }

    // Add type filter to whereClause
    if (type) {
      whereClause.push({
        key: 'type',
        value: type,
        operator: '='
      });
    }

    const paginationPayload = {
      curPage: page,
      perPage: pageSize,
      sortBy,
      direction: sortOrder,
      whereClause
    };

    const response = await apiClient.post<IPaginatedResponse<RecentActivity>>('/dashboard/recent-activity/paginated', paginationPayload);
    
    // Convert response to match expected format (map curPage/perPage to page/pageSize for backward compatibility)
    return {
      data: response.data.data,
      count: response.data.count,
      curPage: response.data.curPage,
      perPage: response.data.perPage,
      totalPages: response.data.totalPages,
      // Legacy fields for backward compatibility
      page: response.data.curPage,
      pageSize: response.data.perPage
    };
  }

  // Get system health status
  static async getSystemHealth() {
    const response = await apiClient.get('/dashboard/system-health');
    return response.data;
  }

  // Get system analytics
  static async getSystemAnalytics() {
    const response = await apiClient.get('/dashboard/analytics');
    return response.data;
  }

  // Get day-wise revenue
  static async getDayWiseRevenue(days: number = 30): Promise<{ [key: string]: number }> {
    const response = await apiClient.get<{ [key: string]: number }>('/dashboard/revenue/day-wise', { days });
    return response.data;
  }
}
