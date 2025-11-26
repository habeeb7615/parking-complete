import { apiClient } from '@/lib/apiClient';
import { logger } from './loggerService';

export interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: 'car' | 'motorcycle' | 'truck' | 'bus';
  check_in_time: string;
  check_out_time?: string;
  location_id: string;
  contractor_id: string;
  mobile_number?: string;
  gate_in_id?: string;
  gate_out_id?: string;
  session_id?: string;
  payment_amount?: number;
  payment_status?: string;
  receipt_id?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  created_on?: string;
  updated_on?: string;
  status?: 'checked_in' | 'checked_out';
  location?: {
    contractor_id?: string;
    locations_name: string;
    address: string;
    hourly_rate?: number;
  };
  parking_locations?: {
    locations_name: string;
    address: string;
    contractor_id: string;
    contractors?: {
      company_name: string;
    };
  };
}

export interface CreateVehicleData {
  plate_number: string;
  vehicle_type: '2-wheeler' | '4-wheeler';
  location_id: string;
  contractor_id: string;
  mobile_number?: string;
  gate_in_id?: string;
  session_id?: string;
}

export interface VehicleCheckoutData {
  check_out_time: string;
  payment_amount: number;
  payment_method: 'cash' | 'card' | 'digital' | 'free';
}

export class VehicleAPI {
  // Attendant only - Create vehicle (check-in)
  static async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>('/vehicles', {
      plate_number: data.plate_number,
      vehicle_type: data.vehicle_type,
      location_id: data.location_id,
      contractor_id: data.contractor_id,
      mobile_number: data.mobile_number,
      gate_in_id: data.gate_in_id,
      session_id: data.session_id
    });

    // Log successful check-in (get user from localStorage)
    try {
      const { AuthAPI } = await import('@/services/authApi');
      const user = AuthAPI.getUser();
      if (user) {
        logger.logVehicleCheckin(data.plate_number, data.location_id, user.id);
      }
    } catch (error) {
      console.error('Error logging vehicle check-in:', error);
    }

    return response.data;
  }

  // Get vehicles for super admin (all)
  static async getAllVehicles(): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data || [];
  }


  // Get vehicles for contractor (from all their locations)
  static async getContractorVehicles(contractorId: string): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/contractor/${contractorId}`);
    return response.data || [];
  }

  // Get vehicles for attendant (assigned locations)
  static async getAttendantVehicles(attendantUserId?: string): Promise<Vehicle[]> {
    let userId = attendantUserId;
    if (!userId) {
      const { AuthAPI } = await import('@/services/authApi');
      const user = AuthAPI.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const response = await apiClient.get<Vehicle[]>(`/vehicles/attendant/${userId}`);
    return response.data || [];
  }

  // Get vehicles by location
  static async getVehiclesByLocation(locationId: string): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>(`/vehicles/location/${locationId}`);
    return response.data || [];
  }

  // Attendant only - Check out vehicle
  static async checkoutVehicle(vehicleId: string, checkoutData: VehicleCheckoutData): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>(`/vehicles/checkout/${vehicleId}`, {
      check_out_time: checkoutData.check_out_time,
      payment_amount: checkoutData.payment_amount,
      payment_method: checkoutData.payment_method
    });

    // Log successful checkout (get user from localStorage)
    try {
      const { AuthAPI } = await import('@/services/authApi');
      const user = AuthAPI.getUser();
      if (user) {
        logger.logVehicleCheckout(response.data.plate_number, checkoutData.payment_amount, user.id);
        logger.logPaymentReceived(checkoutData.payment_amount, checkoutData.payment_method, user.id);
      }
    } catch (error) {
      console.error('Error logging vehicle checkout:', error);
    }

    return response.data;
  }

  // Get vehicle by ID
  static async getVehicleById(id: string): Promise<Vehicle> {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  }

  // Get vehicle statistics
  static async getVehicleStats(locationId?: string): Promise<{
    totalVehicles: number;
    parkedVehicles: number;
    checkedOutVehicles: number;
    overdueVehicles: number;
    todayVehicles: number;
  }> {
    const params = locationId ? { locationId } : {};
    const response = await apiClient.get('/vehicles/stats', params);
    return response.data;
  }

  // Get vehicles by date range
  static async getVehiclesByDateRange(locationId: string, startDate: string, endDate: string): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>('/vehicles/date-range', {
      locationId,
      startDate,
      endDate
    });
    return response.data || [];
  }

  // Update vehicle
  static async updateVehicle(id: string, data: Partial<CreateVehicleData>): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>(`/vehicles/update/${id}`, data);
    return response.data;
  }

  // Delete vehicle
  static async deleteVehicle(vehicleId: string): Promise<void> {
    await apiClient.get(`/vehicles/delete/${vehicleId}`);
  }
}
