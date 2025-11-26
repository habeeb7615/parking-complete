import { apiClient } from '@/lib/apiClient';
import { IPagination, IPaginatedResponse, convertToPaginationPayload } from '@/types/pagination.types';

export interface Contractor {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_number: string | null;
  allowed_locations: number | null;
  allowed_attendants_per_location: number | null;
  rates_2wheeler: any;
  rates_4wheeler: any;
  status: string | null;
  created_by: string | null;
  created_on: string | null;
  updated_by: string | null;
  updated_on: string | null;
  deleted_by: string | null;
  deleted_on: string | null;
  is_deleted: boolean | null;
  // Joined data
  profiles?: {
    user_name: string;
    email: string;
    phone_number?: string;
    subscription_plan_id?: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
    subscription_status?: string;
    subscription_plans?: {
      name: string;
      price: number;
    };
  };
}

export interface Location {
  id: string;
  locations_name: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contractor_id: string;
  total_slots: number | null;
  occupied_slots: number | null;
  status: string | null;
  created_by: string | null;
  created_on: string | null;
  updated_by: string | null;
  updated_on: string | null;
  deleted_by: string | null;
  deleted_on: string | null;
  is_deleted: boolean | null;
}

export interface Attendant {
  id: string;
  user_id: string;
  location_id: string | null;
  status: string | null;
  created_by: string | null;
  created_on: string | null;
  updated_by: string | null;
  updated_on: string | null;
  deleted_by: string | null;
  deleted_on: string | null;
  is_deleted: boolean | null;
  // Joined data
  profiles?: {
    user_name: string;
    email: string;
    phone_number?: string;
  };
  parking_locations?: {
    locations_name: string;
    address: string;
  };
}

export interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  check_in_time: string;
  check_out_time: string | null;
  location_id: string;
  contractor_id: string;
  payment_amount: number | null;
  payment_status: string | null;
  created_by: string | null;
  created_on: string | null;
  updated_by: string | null;
  updated_on: string | null;
  deleted_by: string | null;
  deleted_on: string | null;
  is_deleted: boolean | null;
  // Joined data
  parking_locations?: {
    locations_name: string;
    address: string;
  };
}

export interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  created_on: string;
  location_id: string;
  contractor_id: string;
  // Joined data
  parking_locations?: {
    locations_name: string;
    address: string;
  };
  vehicles?: {
    plate_number: string;
    vehicle_type: string;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  curPage: number;
  perPage: number;
  totalPages: number;
  // Legacy fields for backward compatibility
  page?: number;
  pageSize?: number;
}

export class ContractorAPI {
  // Get all contractors (for super admin)
  static async getAllContractors(): Promise<Contractor[]> {
    const response = await apiClient.get<Contractor[]>('/contractors');
    return response.data || [];
  }

  // Get contractors with pagination
  static async getContractorsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Contractor>> {
    const paginationPayload = convertToPaginationPayload(params);
    const response = await apiClient.post<IPaginatedResponse<Contractor>>('/contractors/paginated', paginationPayload);
    
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
    } as any;
  }

  // Get contractor by user ID (for contractor dashboard)
  static async getContractorByUserId(userId: string): Promise<Contractor> {
    const response = await apiClient.get<Contractor>(`/contractors/user/${userId}`);
    return response.data;
  }

  // Get contractor by ID
  static async getContractorById(id: string): Promise<Contractor> {
    const response = await apiClient.get<Contractor>(`/contractors/${id}`);
    return response.data;
  }

  // Create contractor
  static async createContractor(data: any): Promise<Contractor> {
    const response = await apiClient.post<Contractor>('/contractors', data);
    return response.data;
  }

  // Update contractor
  static async updateContractor(id: string, data: any): Promise<Contractor> {
    const response = await apiClient.post<Contractor>(`/contractors/update/${id}`, data);
    return response.data;
  }

  // Delete contractor (soft delete)
  static async deleteContractor(id: string): Promise<void> {
    await apiClient.get(`/contractors/delete/${id}`);
  }

  // Get all locations under a contractor
  static async getContractorLocations(contractorId: string): Promise<Location[]> {
    const response = await apiClient.get<Location[]>(`/contractors/${contractorId}/locations`);
    return response.data || [];
  }

  // Get all attendants under a contractor
  static async getContractorAttendants(contractorId: string): Promise<Attendant[]> {
    const response = await apiClient.get<Attendant[]>(`/contractors/${contractorId}/attendants`);
    return response.data || [];
  }

  // Get all vehicles under a contractor
  static async getContractorVehicles(contractorId: string): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>(`/contractors/${contractorId}/vehicles`);
    return response.data || [];
  }

  // Get contractor payments
  static async getContractorPayments(contractorId: string): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(`/contractors/${contractorId}/payments`);
    return response.data || [];
  }

  // Get contractor statistics
  static async getContractorStats(contractorId: string): Promise<{
    totalLocations: number;
    totalAttendants: number;
    totalVehicles: number;
    totalRevenue: number;
    todayRevenue: number;
    monthlyRevenue: number;
  }> {
    const response = await apiClient.get(`/contractors/${contractorId}/stats`);
    return response.data;
  }


  // Get day-wise revenue for contractor
  static async getContractorDayWiseRevenue(contractorId: string, days: number = 30): Promise<{ [key: string]: number }> {
    const response = await apiClient.get<{ [key: string]: number }>(`/contractors/${contractorId}/revenue/day-wise`, {
      days
    });
    return response.data;
  }

  // Get month-wise revenue for contractor
  static async getContractorMonthWiseRevenue(contractorId: string, months: number = 12): Promise<{ [key: string]: number }> {
    const response = await apiClient.get<{ [key: string]: number }>(`/contractors/${contractorId}/revenue/month-wise`, {
      months
    });
    return response.data;
  }
}
