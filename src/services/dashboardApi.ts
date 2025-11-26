import { apiClient } from '@/lib/apiClient';

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

  // Get recent activity
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/recent-activity', { limit });
    return response.data || [];
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
