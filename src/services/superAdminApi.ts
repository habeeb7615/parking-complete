import { apiClient } from '@/lib/apiClient';

export interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  contact_number: string;
  allowed_locations: number;
  allowed_attendants_per_location: number;
  status: 'active' | 'inactive';
  rates_2wheeler: any;
  rates_4wheeler: any;
  created_on: string;
  updated_on: string;
  created_by?: string;
  is_deleted: boolean;
  profiles?: {
    user_name: string;
    email: string;
    phone_number: string;
  };
}

export interface Location {
  id: string;
  locations_name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_slots: number;
  occupied_slots: number;
  contractor_id: string;
  status: string;
  created_on: string;
  updated_on: string;
  created_by?: string;
  is_deleted: boolean;
  contractors?: {
    company_name: string;
    user_id: string;
  };
}

export interface Attendant {
  id: string;
  user_id: string;
  location_id?: string;
  status: 'active' | 'inactive';
  created_on: string;
  updated_on: string;
  created_by?: string;
  is_deleted: boolean;
  profiles?: {
    user_name: string;
    email: string;
    phone_number: string;
  };
  parking_locations?: {
    locations_name: string;
  };
}

export interface CreateLocationData {
  locations_name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_slots: number;
  contractor_id: string;
  status?: string;
}

export interface CreateAttendantData {
  user_name: string;
  email: string;
  password?: string;
  phone_number: string;
  location_id?: string;
  contractor_id?: string;
  status?: 'active' | 'inactive';
}

export interface CreateContractorData {
  user_name: string;
  email: string;
  password?: string;
  phone_number: string;
  company_name: string;
  contact_number: string;
  allowed_locations: number;
  allowed_attendants_per_location: number;
  status: 'active' | 'inactive';
  rates_2wheeler: {
    upTo2Hours: number;
    upTo6Hours: number;
    upTo12Hours: number;
    upTo24Hours: number;
  };
  rates_4wheeler: {
    upTo2Hours: number;
    upTo6Hours: number;
    upTo12Hours: number;
    upTo24Hours: number;
  };
}

export class SuperAdminAPI {
  // Get Dashboard Statistics
  static async getDashboardStats(): Promise<{
    totalContractors: number;
    totalLocations: number;
    totalAttendants: number;
    totalVehicles: number;
    totalRevenue: number;
    todayRevenue: number;
    monthlyRevenue: number;
    todayVehicles: number;
    monthlyVehicles: number;
  }> {
    try {
      const { DashboardAPI } = await import('@/services/dashboardApi');
      const metrics = await DashboardAPI.getDashboardMetrics();
      
      return {
        totalContractors: metrics.totalContractors,
        totalLocations: metrics.totalLocations,
        totalAttendants: metrics.activeAttendants,
        totalVehicles: metrics.totalVehicles,
        totalRevenue: metrics.totalRevenue,
        todayRevenue: metrics.dailyRevenue,
        monthlyRevenue: metrics.monthlyRevenue,
        todayVehicles: 0, // TODO: Get from vehicle stats if needed
        monthlyVehicles: 0 // TODO: Get from vehicle stats if needed
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalContractors: 0,
        totalLocations: 0,
        totalAttendants: 0,
        totalVehicles: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        todayVehicles: 0,
        monthlyVehicles: 0
      };
    }
  }

  // Get day-wise revenue for super admin dashboard
  static async getDayWiseRevenue(days: number = 30): Promise<{ [key: string]: number }> {
    try {
      const { DashboardAPI } = await import('@/services/dashboardApi');
      return await DashboardAPI.getDayWiseRevenue(days);
    } catch (error) {
      console.error('Error fetching day-wise revenue:', error);
      return {};
    }
  }
  

  // Contractor Management
  static async getAllContractors(): Promise<any[]> {
    const { ContractorAPI } = await import('@/services/contractorApi');
    return await ContractorAPI.getAllContractors();
  }

  // Get paginated contractors with search
  static async getPaginatedContractors(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    data: any[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc'
    } = params;

    const { ContractorAPI } = await import('@/services/contractorApi');
    return await ContractorAPI.getContractorsPaginated(params);
  }

  static async createContractor(contractorData: CreateContractorData): Promise<any> {
    const response = await apiClient.post('/contractors', {
      user_name: contractorData.user_name,
      email: contractorData.email,
      password: contractorData.password || 'TempPassword123!',
      phone_number: contractorData.phone_number,
      company_name: contractorData.company_name,
      contact_number: contractorData.contact_number,
      allowed_locations: contractorData.allowed_locations,
      allowed_attendants_per_location: contractorData.allowed_attendants_per_location,
      status: contractorData.status || 'active',
      rates_2wheeler: contractorData.rates_2wheeler,
      rates_4wheeler: contractorData.rates_4wheeler,
    });
    return response.data;
  }

  static async updateContractor(contractorId: string, updateData: Partial<CreateContractorData>): Promise<any> {
    const response = await apiClient.post(`/contractors/update/${contractorId}`, updateData);
    return response.data;
  }

  static async deleteContractor(contractorId: string): Promise<void> {
    await apiClient.get(`/contractors/delete/${contractorId}`);
  }

  // Get system analytics for dashboard
  static async getSystemAnalytics(): Promise<{
    today: { vehicles: number; revenue: number };
    yesterday: { vehicles: number; revenue: number };
    thisMonth: { vehicles: number; revenue: number };
    lastMonth: { vehicles: number; revenue: number };
  }> {
    try {
      const { DashboardAPI } = await import('@/services/dashboardApi');
      const analytics = await DashboardAPI.getSystemAnalytics();
      return analytics;
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      return {
        today: { vehicles: 0, revenue: 0 },
        yesterday: { vehicles: 0, revenue: 0 },
        thisMonth: { vehicles: 0, revenue: 0 },
        lastMonth: { vehicles: 0, revenue: 0 }
      };
    }
  }

  // Get all locations
  static async getAllLocations(): Promise<any[]> {
    const { LocationAPI } = await import('@/services/locationApi');
    return await LocationAPI.getAllLocations();
  }

  // Create location (Super Admin only)
  static async createLocation(data: CreateLocationData): Promise<any> {
    const response = await apiClient.post('/locations', {
      locations_name: data.locations_name,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      total_slots: data.total_slots,
      contractor_id: data.contractor_id,
      status: data.status || 'active',
    });
    return response.data;
  }

  // Update location (Super Admin only)
  static async updateLocation(locationId: string, updateData: Partial<CreateLocationData>): Promise<any> {
    const response = await apiClient.post(`/locations/update/${locationId}`, updateData);
    return response.data;
  }

  // Delete location (Super Admin only)
  static async deleteLocation(locationId: string): Promise<void> {
    await apiClient.get(`/locations/delete/${locationId}`);
  }

  // Get all attendants
  static async getAllAttendants(): Promise<any[]> {
    const { AttendantAPI } = await import('@/services/attendantApi');
    return await AttendantAPI.getAllAttendants();
  }

  // Create attendant (Super Admin only)
  static async createAttendant(data: CreateAttendantData): Promise<any> {
    const response = await apiClient.post('/attendants', {
      user_name: data.user_name,
      email: data.email,
      password: data.password || 'TempPassword123!',
      phone_number: data.phone_number,
      location_id: data.location_id,
      contractor_id: data.contractor_id,
      status: data.status || 'active',
    });
    return response.data;
  }

  // Update attendant (Super Admin only)
  static async updateAttendant(attendantId: string, updateData: Partial<CreateAttendantData>): Promise<any> {
    const response = await apiClient.post(`/attendants/update/${attendantId}`, updateData);
    return response.data;
  }

  // Delete attendant (Super Admin only)
  static async deleteAttendant(attendantId: string): Promise<void> {
    await apiClient.get(`/attendants/delete/${attendantId}`);
  }
}