import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';

@Injectable()
export class AttendantDashboardService {
  constructor(
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async getAttendantDashboard(userId: string) {
    // Get attendant by user_id
    const attendant = await this.attendantRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });

    if (!attendant) {
      throw new NotFoundException('Attendant not found');
    }

    if (!attendant.location_id) {
      throw new NotFoundException('Attendant location not assigned');
    }

    const locationId = attendant.location_id;

    // Get today's date range for today's revenue calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel for better performance
    const [
      totalVehicles,
      currentlyParked,
      totalCheckOut,
      totalRevenueResult,
      todayRevenueResult,
    ] = await Promise.all([
      // Total Vehicles: All vehicles at the attendant's location
      this.vehicleRepository.count({
        where: { location_id: locationId, is_deleted: false },
      }),
      // Currently Parked: Vehicles currently parked (check_out_time IS NULL AND check_in_time IS NOT NULL)
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.location_id = :locationId', { locationId })
        .andWhere('vehicle.is_deleted = false')
        .andWhere('vehicle.check_out_time IS NULL')
        .andWhere('vehicle.check_in_time IS NOT NULL')
        .getCount(),
      // Total Check Out: All vehicles checked out (check_out_time IS NOT NULL)
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.location_id = :locationId', { locationId })
        .andWhere('vehicle.is_deleted = false')
        .andWhere('vehicle.check_out_time IS NOT NULL')
        .getCount(),
      // Total Revenue: Sum of payment_amount from vehicles table
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .select('SUM(vehicle.payment_amount)', 'total')
        .where('vehicle.location_id = :locationId', { locationId })
        .andWhere('vehicle.is_deleted = false')
        .andWhere('vehicle.payment_status IN (:...statuses)', { statuses: ['paid', 'free'] })
        .andWhere('vehicle.payment_amount IS NOT NULL')
        .andWhere('vehicle.check_out_time IS NOT NULL')
        .getRawOne(),
      // Today's Revenue: Same as total but for today's check_out_time
      this.vehicleRepository
        .createQueryBuilder('vehicle')
        .select('SUM(vehicle.payment_amount)', 'total')
        .where('vehicle.location_id = :locationId', { locationId })
        .andWhere('vehicle.is_deleted = false')
        .andWhere('vehicle.payment_status IN (:...statuses)', { statuses: ['paid', 'free'] })
        .andWhere('vehicle.payment_amount IS NOT NULL')
        .andWhere('vehicle.check_out_time IS NOT NULL')
        .andWhere('vehicle.check_out_time >= :today', { today })
        .andWhere('vehicle.check_out_time < :tomorrow', { tomorrow })
        .getRawOne(),
    ]);

    // Total Check In: All vehicles checked in (same as total vehicles since all have check_in_time)
    const totalCheckIn = totalVehicles;

    return {
      totalVehicles: totalVehicles,
      totalCheckIn: totalCheckIn,
      totalCheckOut: totalCheckOut,
      currentlyParked: currentlyParked,
      totalRevenue: Number(totalRevenueResult?.total || 0),
      todayRevenue: Number(todayRevenueResult?.total || 0),
    };
  }
}

