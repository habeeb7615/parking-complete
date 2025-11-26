import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Contractor } from '../entities/contractor.entity';
import { Profile } from '../entities/profile.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

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
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateContractorData {
  user_name: string;
  email: string;
  password: string;
  phone_number?: string;
  company_name: string;
  contact_number: string;
  allowed_locations: number;
  allowed_attendants_per_location: number;
  status?: 'active' | 'inactive';
  rates_2wheeler: {
    upTo2Hours: number;
    upTo6Hours: number;
    upTo12Hours: number;
    upTo24Hours: number;
  };
  rates_4wheeler: {
    upTo2Hours: number;
    upTo6Hours: number;
    upTo12Hours: number;
    upTo24Hours: number;
  };
}

@Injectable()
export class ContractorsService {
  constructor(
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getAllContractors() {
    return this.contractorRepository.find({
      where: { is_deleted: false },
      relations: ['profiles'],
      order: { created_on: 'DESC' },
    });
  }

  async getContractorsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Contractor>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.contractorRepository
      .createQueryBuilder('contractor')
      .leftJoinAndSelect('contractor.profiles', 'profile')
      .where('contractor.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(contractor.company_name LIKE :search OR profile.email LIKE :search OR profile.user_name LIKE :search OR contractor.contact_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'company_name') {
      queryBuilder.orderBy('contractor.company_name', orderDirection);
    } else if (sortBy === 'email') {
      queryBuilder.orderBy('profile.email', orderDirection);
    } else if (sortBy === 'status') {
      queryBuilder.orderBy('contractor.status', orderDirection);
    } else {
      queryBuilder.orderBy('contractor.created_on', orderDirection);
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

  async getContractorByUserId(userId: string) {
    return this.contractorRepository.findOne({
      where: { user_id: userId, is_deleted: false },
      relations: ['profiles'],
    });
  }

  async getContractorById(id: string) {
    const contractor = await this.contractorRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['profiles'],
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return contractor;
  }

  async createContractor(data: CreateContractorData, createdBy?: string): Promise<Contractor> {
    // Check if email already exists
    const existingProfile = await this.profileRepository.findOne({
      where: { email: data.email, is_deleted: false },
    });

    if (existingProfile) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create profile
    const userId = randomUUID();
    const profile = this.profileRepository.create({
      id: userId,
      user_name: data.user_name,
      email: data.email,
      password: hashedPassword,
      phone_number: data.phone_number || null,
      role: 'contractor',
      status: data.status || 'active',
      is_first_login: true,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    await this.profileRepository.save(profile);

    // Create contractor
    const contractorId = randomUUID();
    const contractor = this.contractorRepository.create({
      id: contractorId,
      user_id: userId,
      company_name: data.company_name,
      contact_number: data.contact_number,
      allowed_locations: data.allowed_locations,
      allowed_attendants_per_location: data.allowed_attendants_per_location,
      rates_2wheeler: data.rates_2wheeler,
      rates_4wheeler: data.rates_4wheeler,
      status: data.status || 'active',
      created_by: createdBy || null,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    const savedContractor = await this.contractorRepository.save(contractor);
    return this.getContractorById(savedContractor.id);
  }

  async updateContractor(id: string, data: Partial<CreateContractorData>, updatedBy?: string): Promise<Contractor> {
    const contractor = await this.getContractorById(id);

    // Update contractor fields
    if (data.company_name !== undefined) contractor.company_name = data.company_name;
    if (data.contact_number !== undefined) contractor.contact_number = data.contact_number;
    if (data.allowed_locations !== undefined) contractor.allowed_locations = data.allowed_locations;
    if (data.allowed_attendants_per_location !== undefined) contractor.allowed_attendants_per_location = data.allowed_attendants_per_location;
    if (data.rates_2wheeler !== undefined) contractor.rates_2wheeler = data.rates_2wheeler;
    if (data.rates_4wheeler !== undefined) contractor.rates_4wheeler = data.rates_4wheeler;
    if (data.status !== undefined) contractor.status = data.status;
    contractor.updated_by = updatedBy || null;
    contractor.updated_on = new Date();

    await this.contractorRepository.save(contractor);

    // Update profile if needed
    if (data.user_name || data.email || data.phone_number || data.status) {
      const profileUpdate: any = {};
      if (data.user_name) profileUpdate.user_name = data.user_name;
      if (data.email) profileUpdate.email = data.email;
      if (data.phone_number !== undefined) profileUpdate.phone_number = data.phone_number;
      if (data.status) profileUpdate.status = data.status;

      if (data.password) {
        const saltRounds = 10;
        profileUpdate.password = await bcrypt.hash(data.password, saltRounds);
      }

      await this.profileRepository.update(contractor.user_id, profileUpdate);
    }

    return this.getContractorById(id);
  }

  async deleteContractor(id: string, deletedBy?: string): Promise<void> {
    const contractor = await this.getContractorById(id);

    contractor.is_deleted = true;
    contractor.deleted_by = deletedBy || null;
    contractor.deleted_on = new Date();

    await this.contractorRepository.save(contractor);

    // Soft delete profile
    await this.profileRepository.update(contractor.user_id, {
      is_deleted: true,
      deleted_by: deletedBy || null,
      deleted_on: new Date(),
    });
  }

  async getContractorStats(contractorId: string) {
    const contractor = await this.getContractorById(contractorId);

    // Get locations count
    const locationsCount = await this.contractorRepository.manager
      .createQueryBuilder()
      .from('parking_locations', 'location')
      .where('location.contractor_id = :contractorId', { contractorId })
      .andWhere('location.is_deleted = false')
      .getCount();

    // Get attendants count through locations
    const locationIds = await this.contractorRepository.manager
      .createQueryBuilder()
      .select('location.id', 'id')
      .from('parking_locations', 'location')
      .where('location.contractor_id = :contractorId', { contractorId })
      .andWhere('location.is_deleted = false')
      .getRawMany();

    const locationIdArray = locationIds.map(loc => loc.id);
    let attendantsCount = 0;
    if (locationIdArray.length > 0) {
      attendantsCount = await this.contractorRepository.manager
        .createQueryBuilder()
        .from('attendants', 'attendant')
        .where('attendant.location_id IN (:...locationIds)', { locationIds: locationIdArray })
        .andWhere('attendant.is_deleted = false')
        .getCount();
    }

    // Get vehicles count
    const vehiclesCount = await this.contractorRepository.manager
      .createQueryBuilder()
      .from('vehicles', 'vehicle')
      .where('vehicle.contractor_id = :contractorId', { contractorId })
      .andWhere('vehicle.is_deleted = false')
      .getCount();

    // Get revenue from payments
    const revenueResult = await this.contractorRepository.manager
      .createQueryBuilder()
      .select('SUM(payment.amount)', 'total')
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .getRawOne();

    const totalRevenue = Number(revenueResult?.total || 0);

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenueResult = await this.contractorRepository.manager
      .createQueryBuilder()
      .select('SUM(payment.amount)', 'total')
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .andWhere('payment.created_at >= :today', { today })
      .getRawOne();

    const todayRevenue = Number(todayRevenueResult?.total || 0);

    // Get monthly revenue
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenueResult = await this.contractorRepository.manager
      .createQueryBuilder()
      .select('SUM(payment.amount)', 'total')
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .andWhere('payment.created_at >= :thisMonth', { thisMonth })
      .getRawOne();

    const monthlyRevenue = Number(monthlyRevenueResult?.total || 0);

    return {
      totalLocations: locationsCount,
      totalAttendants: attendantsCount,
      totalVehicles: vehiclesCount,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
    };
  }

  async getContractorLocations(contractorId: string) {
    return this.contractorRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('parking_locations', 'location')
      .where('location.contractor_id = :contractorId', { contractorId })
      .andWhere('location.is_deleted = false')
      .orderBy('location.created_on', 'DESC')
      .getRawMany();
  }

  async getContractorAttendants(contractorId: string) {
    // Get location IDs for this contractor
    const locationIds = await this.contractorRepository.manager
      .createQueryBuilder()
      .select('location.id', 'id')
      .from('parking_locations', 'location')
      .where('location.contractor_id = :contractorId', { contractorId })
      .andWhere('location.is_deleted = false')
      .getRawMany();

    const locationIdArray = locationIds.map(loc => loc.id);

    if (locationIdArray.length === 0) {
      return [];
    }

    return this.contractorRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('attendants', 'attendant')
      .where('attendant.location_id IN (:...locationIds)', { locationIds: locationIdArray })
      .andWhere('attendant.is_deleted = false')
      .orderBy('attendant.created_on', 'DESC')
      .getRawMany();
  }

  async getContractorVehicles(contractorId: string) {
    return this.contractorRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('vehicles', 'vehicle')
      .where('vehicle.contractor_id = :contractorId', { contractorId })
      .andWhere('vehicle.is_deleted = false')
      .orderBy('vehicle.created_on', 'DESC')
      .getRawMany();
  }

  async getContractorPayments(contractorId: string) {
    return this.contractorRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .orderBy('payment.created_at', 'DESC')
      .getRawMany();
  }

  async getContractorDayWiseRevenue(contractorId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await this.contractorRepository.manager
      .createQueryBuilder()
      .select(['payment.amount', 'payment.created_at'])
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .andWhere('payment.created_at >= :startDate', { startDate })
      .orderBy('payment.created_at', 'ASC')
      .getRawMany();

    const dayWiseData: { [key: string]: number } = {};
    payments.forEach((payment: any) => {
      const date = new Date(payment.payment_created_at).toISOString().split('T')[0];
      dayWiseData[date] = (dayWiseData[date] || 0) + Number(payment.payment_amount);
    });

    return dayWiseData;
  }

  async getContractorMonthWiseRevenue(contractorId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await this.contractorRepository.manager
      .createQueryBuilder()
      .select(['payment.amount', 'payment.created_at'])
      .from('payments', 'payment')
      .where('payment.contractor_id = :contractorId', { contractorId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .andWhere('payment.created_at >= :startDate', { startDate })
      .orderBy('payment.created_at', 'ASC')
      .getRawMany();

    const monthWiseData: { [key: string]: number } = {};
    payments.forEach((payment: any) => {
      const date = new Date(payment.payment_created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthWiseData[monthKey] = (monthWiseData[monthKey] || 0) + Number(payment.payment_amount);
    });

    return monthWiseData;
  }
}
