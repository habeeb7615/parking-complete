import { apiClient } from '@/lib/apiClient';
import { IPagination, IPaginatedResponse, convertToPaginationPayload } from '@/types/pagination.types';

export interface Payment {
  id: string;
  vehicle_id: string;
  location_id: string;
  contractor_id: string;
  attendant_id?: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'digital' | 'free';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  duration_hours?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  vehicle?: {
    plate_number: string;
    vehicle_type: string;
  };
  location?: {
    name: string;
    address: string;
  };
  contractor?: {
    name: string;
    email: string;
  };
  attendant?: {
    name: string;
    email: string;
  };
}

export interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  averagePayment: number;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    digital: number;
    free: number;
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

export class PaymentAPI {
  // Get all payments (Super Admin)
  static async getAllPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data || [];
  }

  // Get payments with pagination
  static async getPaymentsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const paginationPayload = convertToPaginationPayload(params);
    const response = await apiClient.post<IPaginatedResponse<Payment>>('/payments/paginated', paginationPayload);
    
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

  // Get payments for contractor
  static async getContractorPayments(contractorId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const response = await apiClient.get<PaginatedResponse<Payment>>(`/payments/contractor/${contractorId}`, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder
    });

    return response.data;
  }

  // Get payments for attendant
  static async getAttendantPayments(attendantId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    const response = await apiClient.get<PaginatedResponse<Payment>>(`/payments/attendant/${attendantId}`, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder
    });

    return response.data;
  }

  // Get payments by location
  static async getLocationPayments(locationId: string): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(`/payments/location/${locationId}`);
    return response.data || [];
  }

  // Get payment statistics
  static async getPaymentStats(contractorId?: string, locationId?: string): Promise<PaymentStats> {
    const params: any = {};
    if (contractorId) params.contractorId = contractorId;
    if (locationId) params.locationId = locationId;

    const response = await apiClient.get<PaymentStats>('/payments/stats', params);
    return response.data;
  }

  // Get location-wise payments
  static async getLocationWisePayments(contractorId?: string): Promise<Array<{
    location_id: string;
    location_name: string;
    total_revenue: number;
    total_vehicles: number;
    average_duration: number;
  }>> {
    const params = contractorId ? { contractorId } : {};
    const response = await apiClient.get<Array<{
      location_id: string;
      location_name: string;
      total_revenue: number;
      total_vehicles: number;
      average_duration: number;
    }>>('/payments/location-wise', params);
    return Array.isArray(response.data) ? response.data : [];
  }

  // Get contractor-wise payments
  static async getContractorWisePayments(): Promise<Array<{
    contractor_id: string;
    contractor_name: string;
    total_revenue: number;
    total_locations: number;
    total_vehicles: number;
  }>> {
    const response = await apiClient.get<Array<{
      contractor_id: string;
      contractor_name: string;
      total_revenue: number;
      total_locations: number;
      total_vehicles: number;
    }>>('/payments/contractor-wise');
    return Array.isArray(response.data) ? response.data : [];
  }
}
