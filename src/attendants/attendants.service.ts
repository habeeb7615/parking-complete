import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PaginationParams, PaginatedResponse } from '../contractors/contractors.service';

export interface CreateAttendantData {
  user_name: string;
  email: string;
  password: string;
  phone_number?: string;
  location_id?: string;
  contractor_id?: string;
  status?: 'active' | 'inactive';
}

@Injectable()
export class AttendantsService {
  constructor(
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getAllAttendants() {
    return this.attendantRepository.find({
      where: { is_deleted: false },
      relations: ['profiles', 'parking_locations'],
      order: { created_on: 'DESC' },
    });
  }

  async getAttendantsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<Attendant>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.attendantRepository
      .createQueryBuilder('attendant')
      .leftJoinAndSelect('attendant.profiles', 'profile')
      .leftJoinAndSelect('attendant.parking_locations', 'location')
      .where('attendant.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(profile.user_name LIKE :search OR profile.email LIKE :search OR profile.phone_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'user_name') {
      queryBuilder.orderBy('profile.user_name', orderDirection);
    } else if (sortBy === 'email') {
      queryBuilder.orderBy('profile.email', orderDirection);
    } else if (sortBy === 'status') {
      queryBuilder.orderBy('attendant.status', orderDirection);
    } else {
      queryBuilder.orderBy('attendant.created_on', orderDirection);
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

  async getAttendantByUserId(userId: string) {
    return this.attendantRepository.findOne({
      where: { user_id: userId, is_deleted: false },
      relations: ['profiles', 'parking_locations'],
    });
  }

  async getAttendantById(id: string) {
    const attendant = await this.attendantRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['profiles', 'parking_locations'],
    });

    if (!attendant) {
      throw new NotFoundException('Attendant not found');
    }

    return attendant;
  }

  async getAttendantsByContractor(contractorUserId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Attendant>> {
    // First get contractor ID from user_id
    const contractor = await this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('contractors', 'contractor', 'contractor.user_id = profile.id')
      .where('profile.id = :userId', { userId: contractorUserId })
      .andWhere('profile.role = :role', { role: UserRole.CONTRACTOR })
      .andWhere('profile.is_deleted = :isDeleted', { isDeleted: false })
      .select('contractor.id', 'contractorId')
      .getRawOne();

    if (!contractor) {
      return {
        data: [],
        count: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
      };
    }

    // Get locations for this contractor
    const locations = await this.attendantRepository.manager
      .createQueryBuilder()
      .select('location.id', 'id')
      .from('parking_locations', 'location')
      .where('location.contractor_id = :contractorId', { contractorId: contractor.contractorId })
      .andWhere('location.is_deleted = :isDeleted', { isDeleted: false })
      .getRawMany();

    const locationIds = locations.map(loc => loc.id);

    if (locationIds.length === 0) {
      return {
        data: [],
        count: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
      };
    }

    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.attendantRepository
      .createQueryBuilder('attendant')
      .leftJoinAndSelect('attendant.profiles', 'profile')
      .leftJoinAndSelect('attendant.parking_locations', 'location')
      .where('attendant.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('attendant.location_id IN (:...locationIds)', { locationIds });

    if (search) {
      queryBuilder.andWhere(
        '(profile.user_name LIKE :search OR profile.email LIKE :search OR profile.phone_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'user_name') {
      queryBuilder.orderBy('profile.user_name', orderDirection);
    } else if (sortBy === 'email') {
      queryBuilder.orderBy('profile.email', orderDirection);
    } else if (sortBy === 'status') {
      queryBuilder.orderBy('attendant.status', orderDirection);
    } else {
      queryBuilder.orderBy('attendant.created_on', orderDirection);
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

  async createAttendant(data: CreateAttendantData, createdBy?: string): Promise<Attendant> {
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
      role: UserRole.ATTENDANT,
      status: data.status || 'active',
      is_first_login: true,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    await this.profileRepository.save(profile);

    // Create attendant
    const attendantId = randomUUID();
    const attendant = this.attendantRepository.create({
      id: attendantId,
      user_id: userId,
      location_id: data.location_id || null,
      status: data.status || 'active',
      created_by: createdBy || null,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    const savedAttendant = await this.attendantRepository.save(attendant);
    return this.getAttendantById(savedAttendant.id);
  }

  async updateAttendant(id: string, data: Partial<CreateAttendantData>, updatedBy?: string): Promise<Attendant> {
    const attendant = await this.getAttendantById(id);

    // Update attendant fields
    if (data.location_id !== undefined) attendant.location_id = data.location_id;
    if (data.status !== undefined) attendant.status = data.status;
    attendant.updated_by = updatedBy || null;
    attendant.updated_on = new Date();

    await this.attendantRepository.save(attendant);

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

      await this.profileRepository.update(attendant.user_id, profileUpdate);
    }

    return this.getAttendantById(id);
  }

  async deleteAttendant(id: string, deletedBy?: string): Promise<void> {
    const attendant = await this.getAttendantById(id);

    attendant.is_deleted = true;
    attendant.deleted_by = deletedBy || null;
    attendant.deleted_on = new Date();

    await this.attendantRepository.save(attendant);

    // Soft delete profile
    await this.profileRepository.update(attendant.user_id, {
      is_deleted: true,
      deleted_by: deletedBy || null,
      deleted_on: new Date(),
    });
  }

  async getAttendantStats(attendantId: string) {
    const attendant = await this.getAttendantById(attendantId);

    if (!attendant.location_id) {
      return {
        totalVehicles: 0,
        todayVehicles: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        activeVehicles: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVehicles,
      todayVehicles,
      activeVehicles,
      totalRevenueResult,
      todayRevenueResult,
    ] = await Promise.all([
      this.attendantRepository.manager
        .createQueryBuilder()
        .from('vehicles', 'vehicle')
        .where('vehicle.location_id = :locationId', { locationId: attendant.location_id })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.attendantRepository.manager
        .createQueryBuilder()
        .from('vehicles', 'vehicle')
        .where('vehicle.location_id = :locationId', { locationId: attendant.location_id })
        .andWhere('vehicle.created_on >= :today', { today })
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.attendantRepository.manager
        .createQueryBuilder()
        .from('vehicles', 'vehicle')
        .where('vehicle.location_id = :locationId', { locationId: attendant.location_id })
        .andWhere('vehicle.check_out_time IS NULL')
        .andWhere('vehicle.is_deleted = false')
        .getCount(),
      this.attendantRepository.manager
        .createQueryBuilder()
        .select('SUM(payment.amount)', 'total')
        .from('payments', 'payment')
        .where('payment.location_id = :locationId', { locationId: attendant.location_id })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .getRawOne(),
      this.attendantRepository.manager
        .createQueryBuilder()
        .select('SUM(payment.amount)', 'total')
        .from('payments', 'payment')
        .where('payment.location_id = :locationId', { locationId: attendant.location_id })
        .andWhere('payment.payment_status = :status', { status: 'completed' })
        .andWhere('payment.created_at >= :today', { today })
        .getRawOne(),
    ]);

    return {
      totalVehicles,
      todayVehicles,
      totalRevenue: Number(totalRevenueResult?.total || 0),
      todayRevenue: Number(todayRevenueResult?.total || 0),
      activeVehicles,
    };
  }

  async getAttendantLocations(attendantId: string) {
    const attendant = await this.getAttendantById(attendantId);

    if (!attendant.location_id) {
      return [];
    }

    const location = await this.attendantRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('parking_locations', 'location')
      .where('location.id = :locationId', { locationId: attendant.location_id })
      .andWhere('location.is_deleted = false')
      .getRawOne();

    return location ? [location] : [];
  }

  async getOverallAttendantStats() {
    const [total, active, assigned] = await Promise.all([
      this.attendantRepository.count({ where: { is_deleted: false } }),
      this.attendantRepository.count({ where: { is_deleted: false, status: 'active' } }),
      this.attendantRepository.count({
        where: { is_deleted: false },
        relations: ['parking_locations'],
      }),
    ]);

    return {
      totalAttendants: total,
      activeAttendants: active,
      assignedLocations: assigned,
      averageHours: 0, // Would need to calculate from actual work hours
    };
  }
}
