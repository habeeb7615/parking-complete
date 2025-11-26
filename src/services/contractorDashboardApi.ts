import { apiClient } from '@/lib/apiClient';

export interface ContractorDashboardData {
  contractorId: string;
  contractorName: string;
  email: string;
  assignedLocations: {
    locationId: string;
    locationName: string;
    address: string;
    totalSlots: number;
    occupiedSlots: number;
    occupancyRate: number;
    status: string;
    attendants: {
      attendantId: string;
      attendantName: string;
      phone: string;
      email: string;
      status: string;
    }[];
  }[];
}

export interface ContractorStats {
  totalLocations: number;
  totalAttendants: number;
  totalVehicles: number;
  totalRevenue: number;
  todayRevenue: number;
  occupancyRate: number;
  todayVehicles: number;
}

export class ContractorDashboardAPI {
  // Get contractor dashboard data
  static async getContractorDashboard(userId: string): Promise<ContractorDashboardData> {
    const response = await apiClient.get<ContractorDashboardData>(`/contractor-dashboard/${userId}`);
    return response.data;
  }


  // Get contractor statistics
  static async getContractorStats(userId: string): Promise<ContractorStats> {
    const response = await apiClient.get<ContractorStats>(`/contractor-dashboard/${userId}/stats`);
    return response.data;
  }

}
