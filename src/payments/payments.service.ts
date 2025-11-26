import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaginationParams, PaginatedResponse } from '../contractors/contractors.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getAllPayments() {
    return this.paymentRepository.find({
      relations: ['vehicles', 'parking_locations', 'contractors', 'attendants'],
      order: { created_at: 'DESC' },
    });
  }

  async getPaymentsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.vehicles', 'vehicle')
      .leftJoinAndSelect('payment.parking_locations', 'location')
      .leftJoinAndSelect('payment.contractors', 'contractor')
      .leftJoinAndSelect('payment.attendants', 'attendant');

    if (search) {
      queryBuilder.andWhere(
        '(vehicle.plate_number LIKE :search OR payment.payment_method LIKE :search OR payment.payment_status LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'amount') {
      queryBuilder.orderBy('payment.amount', orderDirection);
    } else if (sortBy === 'payment_method') {
      queryBuilder.orderBy('payment.payment_method', orderDirection);
    } else if (sortBy === 'payment_status') {
      queryBuilder.orderBy('payment.payment_status', orderDirection);
    } else {
      queryBuilder.orderBy('payment.created_at', orderDirection);
    }

    const [data, count] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return {
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getContractorPayments(contractorId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.vehicles', 'vehicle')
      .leftJoinAndSelect('payment.parking_locations', 'location')
      .leftJoinAndSelect('payment.contractors', 'contractor')
      .leftJoinAndSelect('payment.attendants', 'attendant')
      .where('payment.contractor_id = :contractorId', { contractorId });

    if (search) {
      queryBuilder.andWhere(
        '(vehicle.plate_number LIKE :search OR payment.payment_method LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'amount') {
      queryBuilder.orderBy('payment.amount', orderDirection);
    } else if (sortBy === 'created_at') {
      queryBuilder.orderBy('payment.created_at', orderDirection);
    } else {
      queryBuilder.orderBy('payment.created_at', orderDirection);
    }

    const [data, count] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return {
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getAttendantPayments(attendantId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Payment>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.vehicles', 'vehicle')
      .leftJoinAndSelect('payment.parking_locations', 'location')
      .leftJoinAndSelect('payment.contractors', 'contractor')
      .leftJoinAndSelect('payment.attendants', 'attendant')
      .where('payment.attendant_id = :attendantId', { attendantId });

    if (search) {
      queryBuilder.andWhere(
        '(vehicle.plate_number LIKE :search OR payment.payment_method LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    queryBuilder.orderBy('payment.created_at', orderDirection);

    const [data, count] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return {
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getLocationPayments(locationId: string) {
    return this.paymentRepository.find({
      where: { location_id: locationId },
      relations: ['vehicles', 'parking_locations', 'contractors', 'attendants'],
      order: { created_at: 'DESC' },
    });
  }

  async getPaymentStats(contractorId?: string, locationId?: string) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.payment_status = :status', { status: 'completed' });

    if (contractorId) {
      queryBuilder.andWhere('payment.contractor_id = :contractorId', { contractorId });
    }

    if (locationId) {
      queryBuilder.andWhere('payment.location_id = :locationId', { locationId });
    }

    const payments = await queryBuilder
      .select(['payment.amount', 'payment.payment_method', 'payment.created_at'])
      .getMany();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const todayRevenue = payments
      .filter((payment) => new Date(payment.created_at) >= today)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const thisWeekRevenue = payments
      .filter((payment) => new Date(payment.created_at) >= weekAgo)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const thisMonthRevenue = payments
      .filter((payment) => new Date(payment.created_at) >= monthAgo)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const paymentMethodBreakdown = payments.reduce(
      (acc, payment) => {
        const method = payment.payment_method || 'unknown';
        acc[method] = (acc[method] || 0) + Number(payment.amount);
        return acc;
      },
      { cash: 0, card: 0, digital: 0, free: 0 } as Record<string, number>,
    );

    return {
      totalRevenue,
      todayRevenue,
      thisWeekRevenue,
      thisMonthRevenue,
      averagePayment: payments.length > 0 ? totalRevenue / payments.length : 0,
      paymentMethodBreakdown,
    };
  }

  async getLocationWisePayments(contractorId?: string) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.parking_locations', 'location')
      .where('payment.payment_status = :status', { status: 'completed' });

    if (contractorId) {
      queryBuilder.andWhere('payment.contractor_id = :contractorId', { contractorId });
    }

    const payments = await queryBuilder
      .select([
        'payment.location_id',
        'payment.amount',
        'payment.duration_hours',
        'location.locations_name',
      ])
      .getMany();

    const locationStats = payments.reduce((acc, payment) => {
      const locationId = payment.location_id;
      const locationName = payment.parking_locations?.locations_name || 'Unknown';

      if (!acc[locationId]) {
        acc[locationId] = {
          location_id: locationId,
          location_name: locationName,
          total_revenue: 0,
          total_vehicles: 0,
          total_duration: 0,
        };
      }

      acc[locationId].total_revenue += Number(payment.amount);
      acc[locationId].total_vehicles += 1;
      acc[locationId].total_duration += Number(payment.duration_hours || 0);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(locationStats).map((stat: any) => ({
      ...stat,
      average_duration: stat.total_vehicles > 0 ? stat.total_duration / stat.total_vehicles : 0,
    }));
  }

  async getContractorWisePayments() {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.contractors', 'contractor')
      .where('payment.payment_status = :status', { status: 'completed' })
      .select([
        'payment.contractor_id',
        'payment.amount',
        'contractor.company_name',
      ])
      .getMany();

    const contractorStats = payments.reduce((acc, payment) => {
      const contractorId = payment.contractor_id;
      const companyName = payment.contractors?.company_name || 'Unknown';

      if (!acc[contractorId]) {
        acc[contractorId] = {
          contractor_id: contractorId,
          contractor_name: companyName,
          total_revenue: 0,
          total_payments: 0,
        };
      }

      acc[contractorId].total_revenue += Number(payment.amount);
      acc[contractorId].total_payments += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(contractorStats).map((stat: any) => ({
      ...stat,
      average_payment: stat.total_payments > 0 ? stat.total_revenue / stat.total_payments : 0,
    }));
  }
}
