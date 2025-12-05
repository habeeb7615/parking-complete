import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class IncomeService {
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
  ) {}

  async getContractorLocationWiseIncome(userId: string) {
    // Get contractor
    const contractor = await this.contractorRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    // Get all locations for this contractor
    const locations = await this.locationRepository.find({
      where: { contractor_id: contractor.id, is_deleted: false },
      order: { locations_name: 'ASC' },
    });

    if (locations.length === 0) {
      return {
        contractor_id: contractor.id,
        contractor_name: contractor.company_name,
        total_revenue: 0,
        today_revenue: 0,
        this_week_revenue: 0,
        this_month_revenue: 0,
        locations: [],
      };
    }

    const locationIds = locations.map(loc => loc.id);

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    // Get all vehicles with payments for this contractor
    const vehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.contractor_id = :contractorId', { contractorId: contractor.id })
      .andWhere('vehicle.is_deleted = false')
      .andWhere('vehicle.check_out_time IS NOT NULL')
      .andWhere('vehicle.payment_amount > 0')
      .getMany();

    // Get unique created_by user IDs (attendant user_ids)
    const attendantUserIds = [...new Set(vehicles.map(v => v.created_by).filter(id => id !== null))];

    // Fetch attendants with profiles for these user_ids
    const attendantMap = new Map<string, { id: string; name: string; email: string | null }>();
    if (attendantUserIds.length > 0) {
      const attendants = await this.attendantRepository
        .createQueryBuilder('attendant')
        .leftJoinAndSelect('attendant.profiles', 'profile')
        .where('attendant.user_id IN (:...userIds)', { userIds: attendantUserIds })
        .andWhere('attendant.is_deleted = false')
        .getMany();

      attendants.forEach(attendant => {
        if (attendant.profiles) {
          const name = attendant.profiles.attendant_name || attendant.profiles.user_name || 'Unknown Attendant';
          attendantMap.set(attendant.user_id, {
            id: attendant.id,
            name: name,
            email: attendant.profiles.email || null,
          });
        }
      });
    }

    // Group vehicles by location and attendant
    const locationDataMap = new Map<string, {
      location_id: string;
      location_name: string;
      address: string;
      total_revenue: number;
      today_revenue: number;
      this_week_revenue: number;
      this_month_revenue: number;
      total_vehicles: number;
      attendants: Map<string, {
        attendant_id: string;
        attendant_name: string;
        attendant_email: string | null;
        total_revenue: number;
        today_revenue: number;
        this_week_revenue: number;
        this_month_revenue: number;
        total_vehicles: number;
      }>;
    }>();

    // Initialize location data
    locations.forEach(location => {
      locationDataMap.set(location.id, {
        location_id: location.id,
        location_name: location.locations_name,
        address: location.address,
        total_revenue: 0,
        today_revenue: 0,
        this_week_revenue: 0,
        this_month_revenue: 0,
        total_vehicles: 0,
        attendants: new Map(),
      });
    });

    // Process each vehicle
    vehicles.forEach(vehicle => {
      const locationData = locationDataMap.get(vehicle.location_id);
      if (!locationData) return;

      const paymentAmount = Number(vehicle.payment_amount || 0);
      const checkOutTime = vehicle.check_out_time ? new Date(vehicle.check_out_time) : null;

      if (!checkOutTime) return;

      // Identify attendant
      let attendantId = 'unknown';
      let attendantName = 'Unknown Attendant';
      let attendantEmail: string | null = null;

      if (vehicle.created_by) {
        const attendant = attendantMap.get(vehicle.created_by);
        if (attendant) {
          attendantId = attendant.id;
          attendantName = attendant.name;
          attendantEmail = attendant.email;
        }
      }

      // Initialize attendant data if not exists
      if (!locationData.attendants.has(attendantId)) {
        locationData.attendants.set(attendantId, {
          attendant_id: attendantId,
          attendant_name: attendantName,
          attendant_email: attendantEmail,
          total_revenue: 0,
          today_revenue: 0,
          this_week_revenue: 0,
          this_month_revenue: 0,
          total_vehicles: 0,
        });
      }

      const attendantData = locationData.attendants.get(attendantId)!;

      // Update location totals
      locationData.total_revenue += paymentAmount;
      locationData.total_vehicles += 1;

      // Update attendant totals
      attendantData.total_revenue += paymentAmount;
      attendantData.total_vehicles += 1;

      // Check if today
      if (checkOutTime >= today && checkOutTime < tomorrow) {
        locationData.today_revenue += paymentAmount;
        attendantData.today_revenue += paymentAmount;
      }

      // Check if this week
      if (checkOutTime >= weekAgo) {
        locationData.this_week_revenue += paymentAmount;
        attendantData.this_week_revenue += paymentAmount;
      }

      // Check if this month
      if (checkOutTime >= monthStart) {
        locationData.this_month_revenue += paymentAmount;
        attendantData.this_month_revenue += paymentAmount;
      }
    });

    // Calculate contractor totals
    let totalRevenue = 0;
    let todayRevenue = 0;
    let thisWeekRevenue = 0;
    let thisMonthRevenue = 0;

    // Build locations array with attendants
    const locationsArray = Array.from(locationDataMap.values())
      .filter(loc => loc.total_vehicles > 0) // Only include locations with vehicles
      .map(location => {
        totalRevenue += location.total_revenue;
        todayRevenue += location.today_revenue;
        thisWeekRevenue += location.this_week_revenue;
        thisMonthRevenue += location.this_month_revenue;

        // Convert attendants map to array and sort
        const attendantsArray = Array.from(location.attendants.values())
          .sort((a, b) => a.attendant_name.localeCompare(b.attendant_name));

        return {
          location_id: location.location_id,
          location_name: location.location_name,
          address: location.address,
          total_revenue: Number(location.total_revenue.toFixed(2)),
          today_revenue: Number(location.today_revenue.toFixed(2)),
          this_week_revenue: Number(location.this_week_revenue.toFixed(2)),
          this_month_revenue: Number(location.this_month_revenue.toFixed(2)),
          total_vehicles: location.total_vehicles,
          attendants: attendantsArray.map(att => ({
            attendant_id: att.attendant_id,
            attendant_name: att.attendant_name,
            attendant_email: att.attendant_email,
            total_revenue: Number(att.total_revenue.toFixed(2)),
            today_revenue: Number(att.today_revenue.toFixed(2)),
            this_week_revenue: Number(att.this_week_revenue.toFixed(2)),
            this_month_revenue: Number(att.this_month_revenue.toFixed(2)),
            total_vehicles: att.total_vehicles,
          })),
        };
      });

    return {
      contractor_id: contractor.id,
      contractor_name: contractor.company_name,
      total_revenue: Number(totalRevenue.toFixed(2)),
      today_revenue: Number(todayRevenue.toFixed(2)),
      this_week_revenue: Number(thisWeekRevenue.toFixed(2)),
      this_month_revenue: Number(thisMonthRevenue.toFixed(2)),
      locations: locationsArray,
    };
  }
}

