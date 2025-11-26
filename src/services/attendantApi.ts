import { apiClient } from '@/lib/apiClient';
import { IPagination, IPaginatedResponse, convertToPaginationPayload } from '@/types/pagination.types';

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
    contractors?: {
      company_name: string | null;
    };
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
  gate_in_id: string | null;
  gate_out_id: string | null;
  receipt_id: string | null;
  session_id: string | null;
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

export interface CreateVehicleData {
  plate_number: string;
  vehicle_type: string;
  location_id: string;
  contractor_id: string;
}

export interface CreateAttendantData {
  user_name: string;
  email: string;
  password: string;
  phone_number?: string;
  location_id?: string;
  contractor_id: string;
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

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AttendantAPI {
  // ===== SUPER ADMIN ATTENDANT MANAGEMENT =====
  
  // Super Admin - Get all attendants with pagination
  static async getAllAttendants(params: PaginationParams = {}): Promise<PaginatedResponse<Attendant>> {
    const paginationPayload = convertToPaginationPayload(params);
    const response = await apiClient.post<IPaginatedResponse<Attendant>>('/attendants/paginated', paginationPayload);
    
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

  // Get attendants by contractor (for contractor dashboard)
  static async getAttendantsByContractor(contractorUserId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Attendant>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc'
    } = params;

    const response = await apiClient.get<PaginatedResponse<Attendant>>(`/attendants/contractor/${contractorUserId}`, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder
    });

    return response.data;
  }

  // Super Admin - Create attendant
  static async createAttendant(data: CreateAttendantData): Promise<Attendant> {
    const response = await apiClient.post<Attendant>('/attendants', {
      user_name: data.user_name,
      email: data.email,
      password: data.password,
      phone_number: data.phone_number,
      location_id: data.location_id,
      contractor_id: data.contractor_id,
      status: 'active'
    });

    return response.data;
  }

  // Super Admin - Update attendant
  static async updateAttendant(id: string, data: Partial<CreateAttendantData>): Promise<Attendant> {
    const updateData: any = {};
    if (data.user_name) updateData.user_name = data.user_name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.status) updateData.status = data.status;

    const response = await apiClient.post<Attendant>(`/attendants/update/${id}`, updateData);
    return response.data;
  }

  // Super Admin - Delete attendant (soft delete)
  static async deleteAttendant(id: string): Promise<void> {
    await apiClient.get(`/attendants/delete/${id}`);
  }

  // Super Admin - Get attendant statistics
  static async getAttendantStats(attendantId?: string): Promise<{
    totalAttendants?: number;
    activeAttendants?: number;
    assignedLocations?: number;
    averageHours?: number;
    totalVehicles?: number;
    todayVehicles?: number;
    totalRevenue?: number;
    todayRevenue?: number;
    activeVehicles?: number;
  }> {
    if (attendantId) {
      const response = await apiClient.get(`/attendants/${attendantId}/stats`);
      return response.data;
    } else {
      const response = await apiClient.get('/attendants/stats/overall');
      return response.data;
    }
  }

  // ===== ATTENDANT MANAGEMENT =====
  
  // Get attendant by user ID (for attendant dashboard)
  static async getAttendantByUserId(userId: string): Promise<Attendant> {
    const response = await apiClient.get<Attendant>(`/attendants/user/${userId}`);
    return response.data;
  }

  // Get attendant by ID
  static async getAttendantById(id: string): Promise<Attendant> {
    const response = await apiClient.get<Attendant>(`/attendants/${id}`);
    return response.data;
  }

  // Get all locations assigned to an attendant
  static async getAttendantLocations(attendantId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/attendants/${attendantId}/locations`);
    return response.data || [];
  }

  // ===== VEHICLE MANAGEMENT (Location-restricted) =====
  
  // Add Vehicle (only for assigned location)
  static async addVehicle(data: CreateVehicleData, attendantUserId: string): Promise<Vehicle> {
    // First verify attendant has access to this location
    const attendant = await this.getAttendantByUserId(attendantUserId);
    if (!attendant.location_id || attendant.location_id !== data.location_id) {
      throw new Error('You are not authorized to add vehicles to this location');
    }

    // Check if vehicle is already parked (anywhere)
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, plate_number, status, location_id, parking_locations:location_id (locations_name)')
      .eq('plate_number', data.plate_number)
      .eq('status', 'checked_in')
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Error checking existing vehicle: ${checkError.message}`);
    }

    // If vehicle is already parked
    if (existingVehicle) {
      const locationName = existingVehicle.parking_locations?.locations_name || 'Unknown Location';
      throw new Error(`Vehicle ${data.plate_number} is already parked at ${locationName}. Please check out the vehicle first before checking in again.`);
    }

    const checkInTime = new Date().toISOString();
    
    const { data: result, error } = await supabase
      .from('vehicles')
      .insert({
        plate_number: data.plate_number,
        vehicle_type: data.vehicle_type,
        location_id: data.location_id,
        contractor_id: data.contractor_id,
        check_in_time: checkInTime,
        payment_status: 'pending',
        created_by: attendantUserId
      })
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .single();

    if (error) throw error;
    return result;
  }

  // Update Vehicle (only for assigned location)
  static async updateVehicle(vehicleId: string, data: Partial<CreateVehicleData>, attendantUserId: string): Promise<Vehicle> {
    // First verify attendant has access to this vehicle's location
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('location_id')
      .eq('id', vehicleId)
      .eq('is_deleted', false)
      .single();

    if (vehicleError) throw vehicleError;

    const attendant = await this.getAttendantByUserId(attendantUserId);
    if (!attendant.location_id || attendant.location_id !== vehicle.location_id) {
      throw new Error('You are not authorized to update vehicles in this location');
    }

    const { data: result, error } = await supabase
      .from('vehicles')
      .update({
        ...data,
        updated_by: attendantUserId
      })
      .eq('id', vehicleId)
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .single();

    if (error) throw error;
    return result;
  }

  // Exit Vehicle (mark exit) (only for assigned location)
  static async exitVehicle(vehicleId: string, attendantUserId: string): Promise<Vehicle> {
    // First verify attendant has access to this vehicle's location
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('location_id, check_in_time, vehicle_type')
      .eq('id', vehicleId)
      .eq('is_deleted', false)
      .single();

    if (vehicleError) throw vehicleError;

    const attendant = await this.getAttendantByUserId(attendantUserId);
    if (!attendant.location_id || attendant.location_id !== vehicle.location_id) {
      throw new Error('You are not authorized to exit vehicles from this location');
    }

    const checkOutTime = new Date().toISOString();
    const checkInTime = new Date(vehicle.check_in_time);
    const hours = Math.ceil((new Date(checkOutTime).getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
    
    // Get contractor rates from database
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('rates_2wheeler, rates_4wheeler')
      .eq('id', attendant.contractor_id)
      .single();

    let paymentAmount = 0;
    let hourlyRate = 0;
    
    if (contractorError) {
      console.error('Error fetching contractor rates:', contractorError);
      // Use default rates as fallback
      const defaultRates = {
        '2wheeler': { upTo2Hours: 2, upTo6Hours: 5, upTo12Hours: 8, upTo24Hours: 12 },
        '4wheeler': { upTo2Hours: 5, upTo6Hours: 10, upTo12Hours: 18, upTo24Hours: 30 }
      };
      const rates = defaultRates[vehicle.vehicle_type] || defaultRates['4wheeler'];
      
      if (hours <= 2) {
        paymentAmount = rates.upTo2Hours;
      } else if (hours <= 6) {
        paymentAmount = rates.upTo6Hours;
      } else if (hours <= 12) {
        paymentAmount = rates.upTo12Hours;
      } else if (hours <= 24) {
        paymentAmount = rates.upTo24Hours;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        paymentAmount = (days * rates.upTo24Hours) + (remainingHours * (rates.upTo24Hours / 24));
      }
      hourlyRate = paymentAmount / hours;
    } else {
      // Use contractor rates from database
      const rates = vehicle.vehicle_type === '2wheeler' ? contractor.rates_2wheeler : contractor.rates_4wheeler;
      
      if (hours <= 2) {
        paymentAmount = rates.upTo2Hours;
      } else if (hours <= 6) {
        paymentAmount = rates.upTo6Hours;
      } else if (hours <= 12) {
        paymentAmount = rates.upTo12Hours;
      } else if (hours <= 24) {
        paymentAmount = rates.upTo24Hours;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        paymentAmount = (days * rates.upTo24Hours) + (remainingHours * (rates.upTo24Hours / 24));
      }
      hourlyRate = paymentAmount / hours;
    }

    const { data: result, error } = await supabase
      .from('vehicles')
      .update({
        check_out_time: checkOutTime,
        payment_amount: paymentAmount,
        payment_status: 'completed',
        updated_by: attendantUserId
      })
      .eq('id', vehicleId)
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .single();

    if (error) throw error;

    // Create payment record in payments table
    try {
      const { error: paymentRecordError } = await supabase
        .from('payments')
        .insert({
          vehicle_id: vehicleId,
          location_id: vehicle.location_id,
          contractor_id: attendant.contractor_id,
          attendant_id: attendant.id,
          amount: paymentAmount,
          payment_method: 'cash', // Default for attendant exit
          payment_status: 'completed',
          duration_hours: hours,
          hourly_rate: hourlyRate
        });

      if (paymentRecordError) {
        console.error('Payment record creation error:', paymentRecordError);
        // Don't throw error here as vehicle exit is already complete
        console.warn('Payment record could not be created, but vehicle exit was successful');
      } else {
        console.log('Payment record created successfully in payments table');
      }
    } catch (error) {
      console.error('Error creating payment record:', error);
      // Don't throw error here as vehicle exit is already complete
    }

    return result;
  }

  // View Vehicle list (restricted to assigned location)
  static async getVehiclesByLocation(attendantUserId: string): Promise<Vehicle[]> {
    const attendant = await this.getAttendantByUserId(attendantUserId);
    if (!attendant.location_id) {
      throw new Error('No location assigned to this attendant');
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .eq('location_id', attendant.location_id)
      .eq('is_deleted', false)
      .order('created_on', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Filter Vehicles by Date Range (restricted to assigned location)
  static async getVehiclesByDateRange(attendantUserId: string, startDate: string, endDate: string): Promise<Vehicle[]> {
    const attendant = await this.getAttendantByUserId(attendantUserId);
    if (!attendant.location_id) {
      throw new Error('No location assigned to this attendant');
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .eq('location_id', attendant.location_id)
      .eq('is_deleted', false)
      .gte('created_on', startDate)
      .lte('created_on', endDate)
      .order('created_on', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get all vehicles handled by attendant
  static async getVehiclesByAttendant(attendantUserId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        parking_locations (
          locations_name,
          address
        )
      `)
      .eq('created_by', attendantUserId)
      .eq('is_deleted', false)
      .order('created_on', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== STATISTICS =====
  
  // Get attendant statistics for specific attendant
  static async getAttendantStatsByUser(attendantUserId: string): Promise<{
    totalVehicles: number;
    todayVehicles: number;
    totalRevenue: number;
    todayRevenue: number;
    activeVehicles: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const attendant = await this.getAttendantByUserId(attendantUserId);
    
    if (!attendant.location_id) {
      return {
        totalVehicles: 0,
        todayVehicles: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        activeVehicles: 0
      };
    }
    
    const [totalVehiclesResult, todayVehiclesResult, activeVehiclesResult] = await Promise.all([
      supabase
        .from('vehicles')
        .select('payment_amount', { count: 'exact' })
        .eq('location_id', attendant.location_id)
        .eq('is_deleted', false),
      
      supabase
        .from('vehicles')
        .select('payment_amount', { count: 'exact' })
        .eq('location_id', attendant.location_id)
        .gte('created_on', today)
        .eq('is_deleted', false),
      
      supabase
        .from('vehicles')
        .select('payment_amount', { count: 'exact' })
        .eq('location_id', attendant.location_id)
        .is('check_out_time', null)
        .eq('is_deleted', false)
    ]);

    const totalRevenue = totalVehiclesResult.data?.reduce((sum, v) => sum + (v.payment_amount || 0), 0) || 0;
    const todayRevenue = todayVehiclesResult.data?.reduce((sum, v) => sum + (v.payment_amount || 0), 0) || 0;

    return {
      totalVehicles: totalVehiclesResult.count || 0,
      todayVehicles: todayVehiclesResult.count || 0,
      totalRevenue,
      todayRevenue,
      activeVehicles: activeVehiclesResult.count || 0
    };
  }

  // ===== DEVICE RESTRICTION =====
  
  // Check if attendant is already logged in on another device
  static async checkDeviceRestriction(attendantUserId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('device_fingerprint')
        .eq('id', attendantUserId)
        .single();

      if (error) {
        console.error('Device restriction check error:', error);
        // If there's an error checking, allow login to avoid blocking users
        return true;
      }
      
      // If no device fingerprint is set, allow login
      if (!data?.device_fingerprint || data.device_fingerprint === '') {
        console.log('Device restriction: No previous device fingerprint, allowing login');
        return true;
      }
      
      // If device fingerprint matches, allow login
      if (data.device_fingerprint === deviceFingerprint) {
        console.log('Device restriction: Same device detected, allowing login');
        return true;
      }
      
      // Device fingerprint doesn't match, but we'll allow login with warning
      console.log('Device restriction: Different device detected, allowing login with warning');
      return true; // Changed to true to allow device switching
    } catch (error) {
      console.error('Device restriction check failed:', error);
      // If there's an error, allow login to avoid blocking users
      return true;
    }
  }

  // Update device fingerprint for attendant
  static async updateDeviceFingerprint(attendantUserId: string, deviceFingerprint: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ device_fingerprint: deviceFingerprint })
        .eq('id', attendantUserId);

      if (error) {
        console.error('Failed to update device fingerprint:', error);
        // Don't throw error to avoid blocking logout
      } else {
        console.log('Device fingerprint updated successfully');
      }
    } catch (error) {
      console.error('Device fingerprint update failed:', error);
      // Don't throw error to avoid blocking logout
    }
  }

  // Check if attendant is currently logged in (has active session)
  static async isAttendantLoggedIn(attendantUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('device_fingerprint')
        .eq('id', attendantUserId)
        .single();

      if (error) {
        console.error('Check login status error:', error);
        return false;
      }
      
      // If device fingerprint is set and not empty, consider user logged in
      return !!(data?.device_fingerprint && data.device_fingerprint !== '');
    } catch (error) {
      console.error('Check login status failed:', error);
      return false;
    }
  }

  // ===== QR CODE GENERATION =====
  
  // Generate QR code data for vehicle entry
  static generateVehicleQRCode(vehicleData: CreateVehicleData): string {
    const qrData = {
      type: 'vehicle_entry',
      plate_number: vehicleData.plate_number,
      vehicle_type: vehicleData.vehicle_type,
      location_id: vehicleData.location_id,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  }

  // Generate QR code data for vehicle exit
  static generateExitQRCode(vehicleId: string): string {
    const qrData = {
      type: 'vehicle_exit',
      vehicle_id: vehicleId,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  }
}