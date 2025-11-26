import { apiClient } from '@/lib/apiClient';

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

export interface LocationStats {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  occupancyRate: number;
  todayRevenue: number;
  totalRevenue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LocationAPI {
  // Super Admin only - Create location
  static async createLocation(data: CreateLocationData): Promise<Location> {
    const response = await apiClient.post<Location>('/locations', {
      locations_name: data.locations_name,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      total_slots: data.total_slots,
      contractor_id: data.contractor_id,
      status: data.status || 'active'
    });
    return response.data;
  }

  // Super Admin only - Get all locations
  static async getAllLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>('/locations');
    return response.data || [];
  }

  // Get location by ID
  static async getLocationById(id: string): Promise<Location> {
    const response = await apiClient.get<Location>(`/locations/${id}`);
    return response.data;
  }

  // Super Admin only - Get paginated locations
  static async getPaginatedLocations(params: PaginationParams = {}): Promise<PaginatedResponse<Location>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc'
    } = params;

    const response = await apiClient.get<PaginatedResponse<Location>>('/locations/paginated', {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder
    });

    return response.data;
  }

  // Get locations for contractor
  static async getContractorLocations(userId: string): Promise<Location[]> {
    const response = await apiClient.get<Location[]>(`/locations/contractor/${userId}`);
    return response.data || [];
  }

  // Get locations for attendant
  static async getAttendantLocations(attendantId: string): Promise<Location[]> {
    const response = await apiClient.get<Location[]>(`/locations/attendant/${attendantId}`);
    return response.data || [];
  }


  // Update location
  static async updateLocation(id: string, data: Partial<CreateLocationData>): Promise<Location> {
    const response = await apiClient.put<Location>(`/locations/${id}`, data);
    return response.data;
  }

  // Delete location (soft delete)
  static async deleteLocation(id: string): Promise<void> {
    await apiClient.delete(`/locations/${id}`);
  }

  // Get location statistics
  static async getLocationStats(locationId: string): Promise<LocationStats> {
    const response = await apiClient.get<LocationStats>(`/locations/${locationId}/stats`);
    return response.data;
  }


  // Assign location to attendant
  static async assignLocationToAttendant(attendantId: string, locationId: string): Promise<void> {
    await apiClient.post(`/locations/${locationId}/assign-attendant`, {
      attendantId
    });
  }

  // Remove location assignment from attendant
  static async removeLocationFromAttendant(locationId: string, attendantId: string): Promise<void> {
    await apiClient.delete(`/locations/${locationId}/attendant/${attendantId}`);
  }
}
