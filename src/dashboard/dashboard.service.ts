import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Profile } from '../entities/profile.entity';
import { Session } from '../entities/session.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getDashboardMetrics() {
    const [
      contractorsCount,
      locationsCount,
      attendantsCount,
      vehiclesCount,
      profilesCount,
      sessions,
    ] = await Promise.all([
      this.contractorRepository.count({ where: { is_deleted: false } }),
      this.locationRepository.count({ where: { is_deleted: false } }),
      this.attendantRepository.count({
        where: { is_deleted: false, status: 'active' },
      }),
      this.vehicleRepository.count({ where: { is_deleted: false } }),
      this.profileRepository.count({
        where: { is_deleted: false, status: 'active' },
      }),
      this.sessionRepository.find({
        where: { is_deleted: false },
        select: ['payment_amount', 'time_in', 'time_out'],
      }),
    ]);

    const activeSessions = await this.vehicleRepository.count({
      where: { is_deleted: false, check_out_time: null },
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalRevenue = sessions.reduce(
      (sum, session) => sum + (Number(session.payment_amount) || 0),
      0,
    );

    const dailyRevenue = sessions
      .filter((session) => new Date(session.time_in) >= oneDayAgo)
      .reduce((sum, session) => sum + (Number(session.payment_amount) || 0), 0);

    const weeklyRevenue = sessions
      .filter((session) => new Date(session.time_in) >= oneWeekAgo)
      .reduce((sum, session) => sum + (Number(session.payment_amount) || 0), 0);

    const monthlyRevenue = sessions
      .filter((session) => new Date(session.time_in) >= oneMonthAgo)
      .reduce((sum, session) => sum + (Number(session.payment_amount) || 0), 0);

    return {
      totalContractors: contractorsCount,
      totalLocations: locationsCount,
      activeAttendants: attendantsCount,
      totalVehicles: vehiclesCount,
      totalRevenue,
      pendingApprovals: profilesCount,
      activeSessions,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
    };
  }

  async getContractorStats() {
    const contractors = await this.contractorRepository.find({
      where: { is_deleted: false },
      relations: ['parking_locations'],
    });

    // Get attendants count for each contractor through their locations
    const contractorStats = await Promise.all(
      contractors.map(async (contractor) => {
        const locationIds = contractor.parking_locations?.map((loc) => loc.id) || [];
        let totalAttendants = 0;
        
        if (locationIds.length > 0) {
          totalAttendants = await this.attendantRepository
            .createQueryBuilder('attendant')
            .where('attendant.location_id IN (:...locationIds)', { locationIds })
            .andWhere('attendant.is_deleted = false')
            .getCount();
        }

        return {
          id: contractor.id,
          company_name: contractor.company_name || 'Unnamed Company',
          total_locations: contractor.parking_locations?.length || 0,
          total_attendants: totalAttendants,
          total_revenue: 0,
          status: contractor.status || 'inactive',
          created_on: contractor.created_on.toISOString(),
        };
      }),
    );

    return contractorStats;
  }

  async getLocationStats() {
    const locations = await this.locationRepository.find({
      where: { is_deleted: false },
    });

    const locationIds = locations.map((loc) => loc.id);
    const occupiedVehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.location_id IN (:...locationIds)', { locationIds })
      .andWhere('vehicle.check_out_time IS NULL')
      .andWhere('vehicle.is_deleted = false')
      .select(['vehicle.location_id'])
      .getMany();

    const occupiedByLocation = occupiedVehicles.reduce((acc, vehicle) => {
      const locationId = vehicle.location_id;
      acc[locationId] = (acc[locationId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return locations.map((location) => {
      const actualOccupiedSlots = occupiedByLocation[location.id] || 0;
      const occupancyRate =
        location.total_slots > 0
          ? (actualOccupiedSlots / location.total_slots) * 100
          : 0;

      return {
        id: location.id,
        locations_name: location.locations_name,
        address: location.address,
        total_slots: location.total_slots || 0,
        occupied_slots: actualOccupiedSlots,
        occupancy_rate: Math.round(occupancyRate),
        daily_revenue: 0,
        status: location.status || 'inactive',
      };
    });
  }

  async getRecentActivity(limit: number = 10) {
    // Get recent vehicles (check-ins and check-outs)
    const recentVehicles = await this.vehicleRepository.find({
      where: { is_deleted: false },
      order: { created_on: 'DESC' },
      take: limit,
      relations: ['parking_locations'],
    });

    // Get recent contractors
    const recentContractors = await this.contractorRepository.find({
      where: { is_deleted: false },
      order: { created_on: 'DESC' },
      take: 5,
    });

    // Get recent locations
    const recentLocations = await this.locationRepository.find({
      where: { is_deleted: false },
      order: { created_on: 'DESC' },
      take: 5,
    });

    // Get recent payments
    const recentPayments = await this.paymentRepository.find({
      where: { payment_status: 'completed' },
      order: { created_at: 'DESC' },
      take: 5,
      relations: ['vehicles', 'parking_locations'],
    });

    const activities: any[] = [];

    // Add vehicle activities
    recentVehicles.forEach((vehicle) => {
      if (!vehicle.check_out_time) {
        activities.push({
          id: `vehicle_checkin_${vehicle.id}`,
          type: 'vehicle_checkin',
          message: `New vehicle ${vehicle.plate_number} checked in at ${vehicle.parking_locations?.locations_name || 'Unknown Location'}`,
          timestamp: vehicle.created_on.toISOString(),
          metadata: {
            vehicle_id: vehicle.id,
            location_id: vehicle.location_id,
            plate_number: vehicle.plate_number,
          },
        });
      } else {
        activities.push({
          id: `vehicle_checkout_${vehicle.id}`,
          type: 'vehicle_checkout',
          message: `Vehicle ${vehicle.plate_number} checked out from ${vehicle.parking_locations?.locations_name || 'Unknown Location'}`,
          timestamp: vehicle.updated_on.toISOString(),
          metadata: {
            vehicle_id: vehicle.id,
            location_id: vehicle.location_id,
            plate_number: vehicle.plate_number,
          },
        });
      }
    });

    // Add payment activities
    recentPayments.forEach((payment) => {
      activities.push({
        id: `payment_${payment.id}`,
        type: 'payment_received',
        message: `Payment of ₹${payment.amount} received for ${payment.vehicles?.plate_number || 'vehicle'}`,
        timestamp: payment.created_at.toISOString(),
        metadata: {
          amount: payment.amount,
          vehicle_id: payment.vehicle_id,
          location_id: payment.location_id,
        },
      });
    });

    // Add location activities
    recentLocations.forEach((location) => {
      activities.push({
        id: `location_${location.id}`,
        type: 'location_created',
        message: `New parking location "${location.locations_name}" added`,
        timestamp: location.created_on.toISOString(),
        metadata: {
          location_id: location.id,
        },
      });
    });

    // Add contractor activities
    recentContractors.forEach((contractor) => {
      activities.push({
        id: `contractor_${contractor.id}`,
        type: 'contractor_registration',
        message: `New contractor "${contractor.company_name}" registered`,
        timestamp: contractor.created_on.toISOString(),
        metadata: {
          contractor_id: contractor.id,
        },
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getSystemHealth() {
    const [profiles, contractors, locations, vehicles, payments] = await Promise.all([
      this.profileRepository.count({ where: { is_deleted: false } }),
      this.contractorRepository.count({ where: { is_deleted: false } }),
      this.locationRepository.count({ where: { is_deleted: false } }),
      this.vehicleRepository.count({ where: { is_deleted: false } }),
      this.paymentRepository.count({ where: { payment_status: 'completed' } }),
    ]);

    return {
      uptime: '99.9%',
      activeUsers: profiles,
      activeContractors: contractors,
      activeLocations: locations,
      totalVehicles: vehicles,
      totalPayments: payments,
      status: 'All Systems Operational',
    };
  }

  async getSystemAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      todayVehicles,
      todayRevenue,
      yesterdayVehicles,
      yesterdayRevenue,
      thisMonthVehicles,
      thisMonthRevenue,
      lastMonthVehicles,
      lastMonthRevenue,
    ] = await Promise.all([
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.created_on >= :today', { today })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.created_at >= :today', { today })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .select('SUM(payment.amount)', 'total')
        .getRawOne(),
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.created_on >= :yesterday', { yesterday })
        .andWhere('vehicle.created_on < :today', { today })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.created_at >= :yesterday', { yesterday })
        .andWhere('payment.created_at < :today', { today })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .select('SUM(payment.amount)', 'total')
        .getRawOne(),
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.created_on >= :thisMonth', { thisMonth })
        .andWhere('vehicle.created_on < :nextMonth', { nextMonth })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.created_at >= :thisMonth', { thisMonth })
        .andWhere('payment.created_at < :nextMonth', { nextMonth })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .select('SUM(payment.amount)', 'total')
        .getRawOne(),
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.created_on >= :lastMonth', { lastMonth })
        .andWhere('vehicle.created_on < :thisMonth', { thisMonth })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.created_at >= :lastMonth', { lastMonth })
        .andWhere('payment.created_at < :thisMonth', { thisMonth })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .select('SUM(payment.amount)', 'total')
        .getRawOne(),
    ]);

    return {
      today: {
        vehicles: todayVehicles,
        revenue: Number(todayRevenue?.total || 0),
      },
      yesterday: {
        vehicles: yesterdayVehicles,
        revenue: Number(yesterdayRevenue?.total || 0),
      },
      thisMonth: {
        vehicles: thisMonthVehicles,
        revenue: Number(thisMonthRevenue?.total || 0),
      },
      lastMonth: {
        vehicles: lastMonthVehicles,
        revenue: Number(lastMonthRevenue?.total || 0),
      },
    };
  }

  async getDayWiseRevenue(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.created_at >= :startDate', { startDate })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .select(['payment.amount', 'payment.created_at'])
      .orderBy('payment.created_at', 'ASC')
      .getMany();

    const dayWiseData: { [key: string]: number } = {};
    payments.forEach((payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      dayWiseData[date] = (dayWiseData[date] || 0) + Number(payment.amount);
    });

    return dayWiseData;
  }
}
