import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { Contractor } from '../entities/contractor.entity';
import { Payment } from '../entities/payment.entity';
import { Attendant } from '../entities/attendant.entity';
import { Profile } from '../entities/profile.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams, PaginatedResponse } from '../contractors/contractors.service';
import { IPagination, IPaginatedResponse, paginateResponse } from '../common/interfaces/pagination.interface';
import { randomUUID } from 'crypto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CheckoutVehicleDto } from './dto/checkout-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  /**
   * Get current UTC time
   */
  private getCurrentUTCTime(): Date {
    const now = new Date();
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    ));
  }

  async getAllVehicles(userId?: string, userRole?: string) {
    // Get contractor_id if user is a contractor
    let contractorId: string | null = null;
    if (userRole === UserRole.CONTRACTOR && userId) {
      const contractor = await this.contractorRepository.findOne({
        where: { user_id: userId, is_deleted: false },
      });
      if (contractor) {
        contractorId = contractor.id;
      }
    }

    const queryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.parking_locations', 'location')
      .leftJoinAndSelect('vehicle.contractors', 'contractor')
      .where('vehicle.is_deleted = :isDeleted', { isDeleted: false });

    // Filter by contractor_id if user is a contractor
    if (contractorId) {
      queryBuilder.andWhere('vehicle.contractor_id = :contractorId', { contractorId });
    }

    const vehicles = await queryBuilder
      .orderBy('vehicle.check_in_time', 'DESC')
      .getMany();

    return vehicles.map((vehicle) => ({
      ...vehicle,
      status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
    }));
  }

  async getVehiclesPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'check_in_time',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.parking_locations', 'location')
      .leftJoinAndSelect('vehicle.contractors', 'contractor')
      .where('vehicle.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(vehicle.plate_number LIKE :search OR vehicle.vehicle_type LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'plate_number') {
      queryBuilder.orderBy('vehicle.plate_number', orderDirection);
    } else if (sortBy === 'vehicle_type') {
      queryBuilder.orderBy('vehicle.vehicle_type', orderDirection);
    } else if (sortBy === 'check_in_time') {
      queryBuilder.orderBy('vehicle.check_in_time', orderDirection);
    } else if (sortBy === 'check_out_time') {
      queryBuilder.orderBy('vehicle.check_out_time', orderDirection);
    } else {
      queryBuilder.orderBy('vehicle.check_in_time', orderDirection);
    }

    const [vehicles, count] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    const data = vehicles.map((vehicle) => ({
      ...vehicle,
      status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
    }));

    return {
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async pagination(pagination: IPagination, userId?: string, userRole?: string): Promise<IPaginatedResponse<any>> {
    const { curPage, perPage, sortBy = 'check_in_time', direction = 'desc', whereClause } = pagination;
    
    // Get contractor_id if user is a contractor
    let contractorId: string | null = null;
    if (userRole === UserRole.CONTRACTOR && userId) {
      const contractor = await this.contractorRepository.findOne({
        where: { user_id: userId, is_deleted: false },
      });
      if (contractor) {
        contractorId = contractor.id;
      }
    }

    let lwhereClause = 'vehicle.is_deleted = false';
    
    // Filter by contractor_id if user is a contractor
    if (contractorId) {
      lwhereClause += ` AND vehicle.contractor_id = '${contractorId}'`;
    }

    const fieldsToSearch = [
      'plate_number',
      'vehicle_type',
    ];

    fieldsToSearch.forEach((field) => {
      const clause = whereClause.find((p) => p.key === field);
      if (clause?.value) {
        const operator = clause.operator || 'LIKE';
        if (operator === 'LIKE') {
          lwhereClause += ` AND vehicle.${field} LIKE '%${clause.value}%'`;
        } else if (operator === '=') {
          lwhereClause += ` AND vehicle.${field} = '${clause.value}'`;
        } else if (operator === '!=') {
          lwhereClause += ` AND vehicle.${field} != '${clause.value}'`;
        }
      }
    });

    // Date filtering
    const check_in_time = whereClause.find((p: any) => p.key === 'check_in_time' && p.value);
    if (check_in_time) {
      const dateOnly = check_in_time.value.split(' ')[0];
      lwhereClause += ` AND DATE(vehicle.check_in_time) = '${dateOnly}'`;
    }

    const check_out_time = whereClause.find((p: any) => p.key === 'check_out_time' && p.value);
    if (check_out_time) {
      const dateOnly = check_out_time.value.split(' ')[0];
      lwhereClause += ` AND DATE(vehicle.check_out_time) = '${dateOnly}'`;
    }

    // "all" search across multiple fields
    const allValue = whereClause.find((p) => p.key === 'all')?.value;
    if (allValue) {
      const conditions = fieldsToSearch
        .map((field) => `vehicle.${field} LIKE '%${allValue}%'`)
        .join(' OR ');
      lwhereClause += ` AND (${conditions})`;
    }

    const skip = (curPage - 1) * perPage;
    const orderDirection = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Determine sort field
    let orderByField = 'vehicle.check_in_time';
    if (sortBy === 'plate_number') {
      orderByField = 'vehicle.plate_number';
    } else if (sortBy === 'vehicle_type') {
      orderByField = 'vehicle.vehicle_type';
    } else if (sortBy === 'check_in_time') {
      orderByField = 'vehicle.check_in_time';
    } else if (sortBy === 'check_out_time') {
      orderByField = 'vehicle.check_out_time';
    } else if (sortBy === 'created_on') {
      orderByField = 'vehicle.created_on';
    }

    const [list, count] = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.parking_locations', 'location')
      .leftJoinAndSelect('vehicle.contractors', 'contractor')
      .where(lwhereClause)
      .skip(skip)
      .take(perPage)
      .orderBy(orderByField, orderDirection)
      .getManyAndCount();

    const data = list.map((vehicle) => ({
      ...vehicle,
      status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
    }));

    return paginateResponse(data, count, curPage, perPage);
  }

  async getVehicleById(id: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['parking_locations', 'contractors'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return {
      ...vehicle,
      status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
    };
  }

  async getContractorVehicles(contractorId: string) {
    // Fetch vehicles with relations in single query
    const vehicles = await this.vehicleRepository.find({
      where: { contractor_id: contractorId, is_deleted: false },
      relations: ['parking_locations', 'contractors'],
      order: { check_in_time: 'DESC' },
    });

    if (vehicles.length === 0) {
      return [];
    }

    // Get vehicle IDs and unique location IDs
    const vehicleIds = vehicles.map(v => v.id);
    const locationIds = [...new Set(vehicles.map(v => v.location_id))];

    // Parallel fetch: payments with attendants+profiles, and location attendants with profiles
    const [payments, locationAttendants] = await Promise.all([
      // Get payments with attendants and their profiles in single query
      vehicleIds.length > 0
        ? this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.attendants', 'attendant')
            .leftJoinAndSelect('attendant.profiles', 'profile')
            .where('payment.vehicle_id IN (:...vehicleIds)', { vehicleIds })
            .getMany()
        : Promise.resolve([]),
      // Get attendants for locations with profiles in single query
      locationIds.length > 0
        ? this.attendantRepository
            .createQueryBuilder('attendant')
            .leftJoinAndSelect('attendant.profiles', 'profile')
            .where('attendant.location_id IN (:...locationIds)', { locationIds })
            .andWhere('attendant.is_deleted = false')
            .getMany()
        : Promise.resolve([]),
    ]);

    // Create lookup maps (single pass)
    const vehicleToPaymentMap = new Map();
    const locationToAttendantsMap = new Map();

    payments.forEach(payment => {
      if (payment.vehicle_id && !vehicleToPaymentMap.has(payment.vehicle_id)) {
        vehicleToPaymentMap.set(payment.vehicle_id, payment);
      }
    });

    locationAttendants.forEach(attendant => {
      if (!locationToAttendantsMap.has(attendant.location_id)) {
        locationToAttendantsMap.set(attendant.location_id, []);
      }
      locationToAttendantsMap.get(attendant.location_id).push(attendant);
    });

    // Map vehicles with attendant details (single pass)
    return vehicles.map((vehicle) => {
      let attendant = null;
      const payment = vehicleToPaymentMap.get(vehicle.id);
      
      if (payment?.attendants) {
        // Attendant from payment (already has profile from join)
        const att = payment.attendants;
        attendant = {
          id: att.id,
          user_id: att.user_id,
          location_id: att.location_id,
          status: att.status,
          name: att.profiles?.user_name || null,
          email: att.profiles?.email || null,
          phone_number: att.profiles?.phone_number || null,
        };
      } else {
        // Get first attendant from location
        const locAttendants = locationToAttendantsMap.get(vehicle.location_id) || [];
        if (locAttendants.length > 0) {
          const locAtt = locAttendants[0];
          attendant = {
            id: locAtt.id,
            user_id: locAtt.user_id,
            location_id: locAtt.location_id,
            status: locAtt.status,
            name: locAtt.profiles?.user_name || null,
            email: locAtt.profiles?.email || null,
            phone_number: locAtt.profiles?.phone_number || null,
          };
        }
      }

      return {
        ...vehicle,
        status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
        attendant: attendant,
      };
    });
  }

  async getVehiclesByLocation(locationId: string) {
    // Use query builder to ensure DESC order
    const vehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.parking_locations', 'location')
      .leftJoinAndSelect('vehicle.contractors', 'contractor')
      .where('vehicle.location_id = :locationId', { locationId })
      .andWhere('vehicle.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('vehicle.check_in_time', 'DESC')
      .getMany();

    return vehicles.map((vehicle) => ({
      ...vehicle,
      status: vehicle.check_out_time === null ? 'checked_in' : 'checked_out',
    }));
  }

  async createVehicle(data: CreateVehicleDto, createdBy?: string) {
    // Check if vehicle is already checked in
    const existingVehicle = await this.vehicleRepository.findOne({
      where: {
        plate_number: data.plate_number,
        check_out_time: null,
        is_deleted: false,
      },
    });

    if (existingVehicle) {
      throw new Error(`Vehicle ${data.plate_number} is already checked in`);
    }

    // Get current UTC time
    const utcNow = this.getCurrentUTCTime();

    const vehicleId = randomUUID();
    const vehicle = this.vehicleRepository.create({
      id: vehicleId,
      plate_number: data.plate_number,
      vehicle_type: data.vehicle_type,
      location_id: data.location_id,
      contractor_id: data.contractor_id,
      mobile_number: data.mobile_number || null,
      gate_in_id: data.gate_in_id || null,
      session_id: data.session_id || null,
      check_in_time: utcNow,
      payment_status: 'pending',
      created_by: createdBy || null,
      is_deleted: false,
      created_on: utcNow,
      updated_on: utcNow,
    });

    const savedVehicle = await this.vehicleRepository.save(vehicle);
    return this.getVehicleById(savedVehicle.id);
  }

  async updateVehicle(id: string, data: UpdateVehicleDto, updatedBy?: string) {
    const vehicle = await this.getVehicleById(id);

    if (data.plate_number !== undefined) vehicle.plate_number = data.plate_number;
    if (data.vehicle_type !== undefined) vehicle.vehicle_type = data.vehicle_type;
    if (data.location_id !== undefined) vehicle.location_id = data.location_id;
    if (data.contractor_id !== undefined) vehicle.contractor_id = data.contractor_id;
    if (data.mobile_number !== undefined) vehicle.mobile_number = data.mobile_number;
    vehicle.updated_by = updatedBy || null;
    vehicle.updated_on = this.getCurrentUTCTime();

    await this.vehicleRepository.save(vehicle);
    return this.getVehicleById(id);
  }

  async checkoutVehicle(vehicleId: string, checkoutData: CheckoutVehicleDto, updatedBy?: string) {
    // Fetch vehicle directly from repository to get original check_in_time
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, is_deleted: false },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.check_out_time) {
      throw new Error('Vehicle is already checked out');
    }

    if (!vehicle.check_in_time) {
      throw new BadRequestException('Vehicle check-in time is missing');
    }

    // CRITICAL: Get original check_in_time directly from database entity
    // Do NOT modify or convert this value
    const originalCheckInTime = vehicle.check_in_time;
    const checkInTime = originalCheckInTime;

    // Get current UTC time
    const utcNow = this.getCurrentUTCTime();

    // Always use current UTC time for checkout to avoid timezone issues
    // Frontend should not send checkout time - it should be set automatically
    let checkoutTime = utcNow;

    // If frontend sends a checkout time, validate it
    if (checkoutData.check_out_time) {
      try {
        const parsedTime = new Date(checkoutData.check_out_time);
        
        // Only use frontend time if it's valid and after check-in time
        if (!isNaN(parsedTime.getTime()) && parsedTime > checkInTime) {
          // Convert to UTC to ensure consistency
          checkoutTime = new Date(Date.UTC(
            parsedTime.getUTCFullYear(),
            parsedTime.getUTCMonth(),
            parsedTime.getUTCDate(),
            parsedTime.getUTCHours(),
            parsedTime.getUTCMinutes(),
            parsedTime.getUTCSeconds(),
            parsedTime.getUTCMilliseconds()
          ));
          
          // Ensure checkout time is not more than 1 minute in the future
          const timeDifference = checkoutTime.getTime() - utcNow.getTime();
          const oneMinuteInMs = 60 * 1000;
          
          if (timeDifference > oneMinuteInMs) {
            // If checkout time is more than 1 minute in the future, use current UTC time
            checkoutTime = utcNow;
          }
        }
      } catch (error) {
        // If parsing fails, use current UTC time
        checkoutTime = utcNow;
      }
    }

    // Final validation: checkout time must be after check-in time
    if (checkoutTime <= checkInTime) {
      checkoutTime = utcNow;
    }

    // CRITICAL: Use raw SQL query to update only specific fields
    // This ensures check_in_time is NEVER modified or touched
    // Pass Date objects directly - TypeORM will handle timezone conversion based on database config
    await this.vehicleRepository.query(
      `UPDATE vehicles 
       SET check_out_time = ?, 
           payment_amount = ?, 
           payment_status = ?, 
           updated_by = ?, 
           updated_on = ?
       WHERE id = ? AND is_deleted = false`,
      [
        checkoutTime,
        checkoutData.payment_amount,
        checkoutData.payment_method === 'free' ? 'free' : 'paid',
        updatedBy || null,
        utcNow,
        vehicleId,
      ]
    );

    // Verify check_in_time was not modified by querying it directly
    const verifyCheckInTime = await this.vehicleRepository.query(
      `SELECT check_in_time FROM vehicles WHERE id = ?`,
      [vehicleId]
    );

    // Return updated vehicle with original check_in_time preserved
    const updatedVehicle = await this.getVehicleById(vehicleId);
    
    // Ensure check_in_time matches original (in case of any timezone display issues)
    if (verifyCheckInTime && verifyCheckInTime[0]) {
      // Use the verified check_in_time from database
      updatedVehicle.check_in_time = verifyCheckInTime[0].check_in_time;
    }
    
    return updatedVehicle;
  }

  async deleteVehicle(id: string, deletedBy?: string): Promise<void> {
    const vehicle = await this.getVehicleById(id);

    vehicle.is_deleted = true;
    vehicle.deleted_by = deletedBy || null;
    vehicle.deleted_on = this.getCurrentUTCTime();

    await this.vehicleRepository.save(vehicle);
  }

  async getVehicleStats(locationId?: string) {
    const queryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.is_deleted = false');

    if (locationId) {
      queryBuilder.andWhere('vehicle.location_id = :locationId', { locationId });
    }

    const vehicles = await queryBuilder
      .select(['vehicle.id', 'vehicle.check_out_time', 'vehicle.check_in_time'])
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      totalVehicles: vehicles.length,
      parkedVehicles: vehicles.filter(v => !v.check_out_time).length,
      checkedOutVehicles: vehicles.filter(v => v.check_out_time).length,
      overdueVehicles: 0, // Would need to calculate based on duration
      todayVehicles: vehicles.filter(v => new Date(v.check_in_time) >= today).length,
    };
  }

  async getAttendantVehicles(attendantUserId: string) {
    // Get attendant's location
    const attendant = await this.vehicleRepository.manager
      .createQueryBuilder()
      .select('attendant.location_id', 'location_id')
      .from('attendants', 'attendant')
      .innerJoin('profiles', 'profile', 'profile.id = attendant.user_id')
      .where('profile.id = :userId', { userId: attendantUserId })
      .andWhere('attendant.is_deleted = false')
      .andWhere('attendant.status = :status', { status: 'active' })
      .getRawOne();

    if (!attendant || !attendant.location_id) {
      return [];
    }

    return this.getVehiclesByLocation(attendant.location_id);
  }

  async getVehiclesByDateRange(locationId: string, startDate: string, endDate: string) {
    return this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.parking_locations', 'location')
      .leftJoinAndSelect('vehicle.contractors', 'contractor')
      .where('vehicle.location_id = :locationId', { locationId })
      .andWhere('vehicle.is_deleted = false')
      .andWhere('vehicle.created_on >= :startDate', { startDate: new Date(startDate) })
      .andWhere('vehicle.created_on <= :endDate', { endDate: new Date(endDate) })
      .orderBy('vehicle.created_on', 'DESC')
      .getMany();
  }
}
