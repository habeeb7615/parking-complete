import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Payment } from '../entities/payment.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class ContractorDashboardService {
  constructor(
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getContractorDashboard(userId: string) {
    // Get contractor
    const contractor = await this.contractorRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    // Get locations
    const locations = await this.locationRepository.find({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    const locationIds = locations.map(loc => loc.id);

    // Get attendants
    let attendantsCount = 0;
    if (locationIds.length > 0) {
      attendantsCount = await this.attendantRepository
        .createQueryBuilder('attendant')
        .where('attendant.location_id IN (:...locationIds)', { locationIds })
        .andWhere('attendant.is_deleted = false')
        .getCount();
    }

    // Get vehicles
    const vehiclesCount = await this.vehicleRepository.count({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    // Get active vehicles (checked in)
    const activeVehicles = await this.vehicleRepository.count({
      where: {
        contractor_id: contractor.id,
        check_out_time: null,
        is_deleted: false,
      },
    });

    // Get revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRevenueResult, todayRevenueResult] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.contractor_id = :contractorId', { contractorId: contractor.id })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .getRawOne(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.contractor_id = :contractorId', { contractorId: contractor.id })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .andWhere('payment.created_at >= :today', { today })
        .getRawOne(),
    ]);

    return {
      contractor: {
        id: contractor.id,
        company_name: contractor.company_name,
        status: contractor.status,
      },
      locations: {
        total: locations.length,
        active: locations.filter(loc => loc.status === 'active').length,
      },
      attendants: {
        total: attendantsCount,
      },
      vehicles: {
        total: vehiclesCount,
        active: activeVehicles,
      },
      revenue: {
        total: Number(totalRevenueResult?.total || 0),
        today: Number(todayRevenueResult?.total || 0),
      },
    };
  }

  async getContractorStats(userId: string) {
    const contractor = await this.contractorRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    // Get locations
    const locations = await this.locationRepository.find({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    const locationIds = locations.map(loc => loc.id);

    // Get attendants
    let attendantsCount = 0;
    if (locationIds.length > 0) {
      attendantsCount = await this.attendantRepository
        .createQueryBuilder('attendant')
        .where('attendant.location_id IN (:...locationIds)', { locationIds })
        .andWhere('attendant.is_deleted = false')
        .getCount();
    }

    // Get total vehicles
    const totalVehicles = await this.vehicleRepository.count({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    // Get today's vehicles (vehicles checked in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVehicles = await this.vehicleRepository.count({
      where: {
        contractor_id: contractor.id,
        is_deleted: false,
      },
    });

    // Get today's vehicles count (vehicles created today)
    const todayVehiclesCount = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.contractor_id = :contractorId', { contractorId: contractor.id })
      .andWhere('vehicle.is_deleted = false')
      .andWhere('DATE(vehicle.created_on) = DATE(:today)', { today: new Date() })
      .getCount();

    // Get total revenue from vehicles table (payment_amount field)
    // Payment status can be 'paid' or 'free' (set during checkout)
    const totalRevenueResult = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('SUM(vehicle.payment_amount)', 'total')
      .where('vehicle.contractor_id = :contractorId', { contractorId: contractor.id })
      .andWhere('vehicle.is_deleted = false')
      .andWhere('vehicle.payment_status IN (:...statuses)', { statuses: ['paid', 'free'] })
      .andWhere('vehicle.payment_amount IS NOT NULL')
      .andWhere('vehicle.check_out_time IS NOT NULL')
      .getRawOne();

    const totalRevenue = Number(totalRevenueResult?.total || 0);

    // Get today's revenue from vehicles table
    // Use check_out_time for date comparison since payment is set during checkout
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevenueResult = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .select('SUM(vehicle.payment_amount)', 'total')
      .where('vehicle.contractor_id = :contractorId', { contractorId: contractor.id })
      .andWhere('vehicle.is_deleted = false')
      .andWhere('vehicle.payment_status IN (:...statuses)', { statuses: ['paid', 'free'] })
      .andWhere('vehicle.payment_amount IS NOT NULL')
      .andWhere('vehicle.check_out_time IS NOT NULL')
      .andWhere('vehicle.check_out_time >= :today', { today })
      .andWhere('vehicle.check_out_time < :tomorrow', { tomorrow })
      .getRawOne();

    const todayRevenue = Number(todayRevenueResult?.total || 0);

    // Calculate occupancy rate
    // Occupied slots = vehicles with check_out_time = null
    const occupiedSlots = await this.vehicleRepository.count({
      where: {
        contractor_id: contractor.id,
        check_out_time: null,
        is_deleted: false,
      },
    });

    // Total slots = sum of total_slots from all locations
    const totalSlots = locations.reduce((sum, loc) => sum + (loc.total_slots || 0), 0);
    const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

    return {
      totalLocations: locations.length,
      totalAttendants: attendantsCount,
      totalVehicles: totalVehicles,
      todayVehicles: todayVehiclesCount,
      todayRevenue: todayRevenue,
      totalRevenue: totalRevenue,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal place
    };
  }

  async getContractorRecentActivity(userId: string, limit: number = 10) {
    console.log('[Service] getContractorRecentActivity - Started');
    console.log('[Service] User ID:', userId);
    console.log('[Service] User ID type:', typeof userId);
    console.log('[Service] Limit:', limit);
    
    // Get contractor
    console.log('[Service] Fetching contractor with user_id:', userId);
    
    // First, let's check if any contractor exists with this user_id (even if deleted)
    const allContractors = await this.contractorRepository.find({
      where: { user_id: userId },
    });
    console.log('[Service] All contractors (including deleted) with this user_id:', allContractors.length);
    if (allContractors.length > 0) {
      console.log('[Service] Contractors found:', allContractors.map(c => ({
        id: c.id,
        user_id: c.user_id,
        company_name: c.company_name,
        is_deleted: c.is_deleted
      })));
    }
    
    const contractor = await this.contractorRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });
    
    console.log('[Service] Contractor found:', contractor ? `ID: ${contractor.id}, Company: ${contractor.company_name}, User ID: ${contractor.user_id}` : 'Not found');
    
    if (!contractor) {
      // Let's also check if user exists in profiles
      const profile = await this.profileRepository.findOne({
        where: { id: userId, is_deleted: false },
      });
      console.log('[Service] Profile found:', profile ? `ID: ${profile.id}, Email: ${profile.email}, Role: ${profile.role}` : 'Not found');
      
      console.error('[Service] Error: Contractor not found for user ID:', userId);
      console.error('[Service] Please verify:');
      console.error('  1. User ID is correct:', userId);
      console.error('  2. Contractor exists in database with this user_id');
      console.error('  3. Contractor is_deleted = false');
      throw new NotFoundException('Contractor not found');
    }

    // Get all locations for this contractor
    console.log('[Service] Fetching locations for contractor:', contractor.id);
    const locations = await this.locationRepository.find({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    const locationIds = locations.map(loc => loc.id);
    console.log('[Service] Locations found:', locations.length);
    console.log('[Service] Location IDs:', locationIds);

    if (locationIds.length === 0) {
      console.log('[Service] No locations found, returning empty array');
      return [];
    }

    // Get recent vehicles with payments and attendants
    console.log('[Service] Fetching recent vehicles...');
    const recentVehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.location_id IN (:...locationIds)', { locationIds })
      .andWhere('vehicle.is_deleted = false')
      .orderBy('vehicle.created_on', 'DESC')
      .limit(limit * 2)
      .getMany();

    console.log('[Service] Vehicles found:', recentVehicles.length);

    // Get payments for these vehicles
    const vehicleIds = recentVehicles.map(v => v.id);
    console.log('[Service] Fetching payments for vehicles:', vehicleIds.length);
    const payments = vehicleIds.length > 0 
      ? await this.paymentRepository.find({
          where: { vehicle_id: In(vehicleIds) },
          order: { created_at: 'DESC' },
        })
      : [];

    console.log('[Service] Payments found:', payments.length);

    // Get attendants for locations with their profiles
    console.log('[Service] Fetching attendants...');
    const attendants = await this.attendantRepository
      .createQueryBuilder('attendant')
      .leftJoin('profiles', 'profile', 'profile.id = attendant.user_id AND profile.is_deleted = false')
      .select([
        'attendant.id',
        'attendant.location_id',
        'profile.user_name',
      ])
      .where('attendant.location_id IN (:...locationIds)', { locationIds })
      .andWhere('attendant.is_deleted = false')
      .getRawMany();

    console.log('[Service] Attendants found:', attendants.length);

    // Create a map of location_id to attendant name (get the first attendant for each location)
    const locationToAttendantMap = new Map();
    attendants.forEach(attendant => {
      if (attendant.attendant_location_id && attendant.profile_user_name) {
        // Only set if not already set (to get first attendant per location)
        if (!locationToAttendantMap.has(attendant.attendant_location_id)) {
          locationToAttendantMap.set(attendant.attendant_location_id, attendant.profile_user_name);
        }
      }
    });

    console.log('[Service] Location to Attendant Map:', Array.from(locationToAttendantMap.entries()));

    // Create a map of vehicle_id to payment
    const vehicleToPaymentMap = new Map();
    payments.forEach(payment => {
      if (!vehicleToPaymentMap.has(payment.vehicle_id)) {
        vehicleToPaymentMap.set(payment.vehicle_id, payment);
      }
    });

    console.log('[Service] Vehicle to Payment Map size:', vehicleToPaymentMap.size);

    // Format the response
    console.log('[Service] Formatting response...');
    const activities = recentVehicles.map((vehicle) => {
      const payment = vehicleToPaymentMap.get(vehicle.id);
      const attendantName = locationToAttendantMap.get(vehicle.location_id) || 'N/A';
      
      // Use payment amount if available, otherwise use vehicle payment_amount
      const amount = payment 
        ? Number(payment.amount) 
        : (vehicle.payment_amount ? Number(vehicle.payment_amount) : 0);

      return {
        attendant_name: attendantName,
        plate_number: vehicle.plate_number,
        vehicle_type: vehicle.vehicle_type,
        check_in_time: vehicle.check_in_time,
        check_out_time: vehicle.check_out_time,
        amount: amount,
        payment_status: payment?.payment_status || vehicle.payment_status || 'pending',
        created_on: payment?.created_at || vehicle.created_on,
      };
    });

    // Sort by created_on descending and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())
      .slice(0, limit);

    console.log('[Service] Final activities count:', sortedActivities.length);
    console.log('[Service] getContractorRecentActivity - Completed');
    
    return sortedActivities;
  }
}

