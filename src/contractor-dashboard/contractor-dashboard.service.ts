import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contractor } from '../entities/contractor.entity';
import { Location } from '../entities/location.entity';
import { Attendant } from '../entities/attendant.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Payment } from '../entities/payment.entity';

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

    // Get vehicles
    const vehiclesCount = await this.vehicleRepository.count({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    // Get revenue
    const revenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.contractor_id = :contractorId', { contractorId: contractor.id })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .getRawOne();

    return {
      totalLocations: locations.length,
      totalAttendants: attendantsCount,
      totalVehicles: vehiclesCount,
      totalRevenue: Number(revenueResult?.total || 0),
    };
  }
}

