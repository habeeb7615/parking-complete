import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Attendant } from '../entities/attendant.entity';
import { Contractor } from '../entities/contractor.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationParams, PaginatedResponse } from '../contractors/contractors.service';
import { IPagination, IPaginatedResponse, paginateResponse } from '../common/interfaces/pagination.interface';
import { randomUUID } from 'crypto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
  ) {}

  async getAllLocations() {
    try {
      // Try to load locations without relations first to avoid relation errors
      const locations = await this.locationRepository
        .createQueryBuilder('location')
        .leftJoinAndSelect('location.contractors', 'contractor')
        .where('location.is_deleted = :isDeleted', { isDeleted: false })
        .orderBy('location.created_on', 'DESC')
        .getMany();

      if (!locations || locations.length === 0) {
        return [];
      }

      const locationIds = locations.map((loc) => loc.id);
      let occupiedVehicles = [];
      
      if (locationIds.length > 0) {
        try {
          occupiedVehicles = await this.vehicleRepository
            .createQueryBuilder('vehicle')
            .where('vehicle.location_id IN (:...locationIds)', { locationIds })
            .andWhere('vehicle.check_out_time IS NULL')
            .andWhere('vehicle.is_deleted = false')
            .select(['vehicle.location_id'])
            .getMany();
        } catch (vehicleError) {
          console.error('Error fetching occupied vehicles:', vehicleError);
          // Continue with empty occupied vehicles if query fails
          occupiedVehicles = [];
        }
      }

      const occupiedByLocation = occupiedVehicles.reduce((acc, vehicle) => {
        const locationId = vehicle.location_id;
        acc[locationId] = (acc[locationId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return locations.map((location) => ({
        ...location,
        occupied_slots: occupiedByLocation[location.id] || 0,
      }));
    } catch (error) {
      console.error('Error in getAllLocations:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getLocationsPaginated(params: PaginationParams = {}): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'created_on',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.contractors', 'contractor')
      .where('location.is_deleted = :isDeleted', { isDeleted: false });

    if (search) {
      queryBuilder.andWhere(
        '(location.locations_name LIKE :search OR location.address LIKE :search OR location.city LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (sortBy === 'locations_name') {
      queryBuilder.orderBy('location.locations_name', orderDirection);
    } else if (sortBy === 'address') {
      queryBuilder.orderBy('location.address', orderDirection);
    } else if (sortBy === 'status') {
      queryBuilder.orderBy('location.status', orderDirection);
    } else {
      queryBuilder.orderBy('location.created_on', orderDirection);
    }

    const [locations, count] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    // Calculate occupied slots for each location
    const locationIds = locations.map((loc) => loc.id);
    let occupiedVehicles = [];
    
    if (locationIds.length > 0) {
      occupiedVehicles = await this.vehicleRepository
        .createQueryBuilder('vehicle')
        .where('vehicle.location_id IN (:...locationIds)', { locationIds })
        .andWhere('vehicle.check_out_time IS NULL')
        .andWhere('vehicle.is_deleted = false')
        .select(['vehicle.location_id'])
        .getMany();
    }

    const occupiedByLocation = occupiedVehicles.reduce((acc, vehicle) => {
      const locationId = vehicle.location_id;
      acc[locationId] = (acc[locationId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = locations.map((location) => ({
      ...location,
      occupied_slots: occupiedByLocation[location.id] || 0,
    }));

    return {
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async pagination(pagination: IPagination): Promise<IPaginatedResponse<any>> {
    try {
      const { curPage, perPage, sortBy = 'created_on', direction = 'desc', whereClause = [] } = pagination;
      
      // Validate pagination params
      if (!curPage || curPage < 1) {
        throw new Error('Invalid curPage: must be >= 1');
      }
      if (!perPage || perPage < 1) {
        throw new Error('Invalid perPage: must be >= 1');
      }

      const queryBuilder = this.locationRepository
        .createQueryBuilder('location')
        .leftJoinAndSelect('location.contractors', 'contractor')
        .where('location.is_deleted = :isDeleted', { isDeleted: false });

      const fieldsToSearch = [
        'locations_name',
        'address',
        'city',
        'state',
        'pincode',
        'status',
      ];

      // Process whereClause conditions
      if (whereClause && Array.isArray(whereClause) && whereClause.length > 0) {
        fieldsToSearch.forEach((field) => {
          const clause = whereClause.find((p) => p.key === field);
          if (clause?.value) {
            const operator = clause.operator || 'LIKE';
            const paramName = `param_${field}`;
            if (operator === 'LIKE') {
              queryBuilder.andWhere(`location.${field} LIKE :${paramName}`, { [paramName]: `%${clause.value}%` });
            } else if (operator === '=') {
              queryBuilder.andWhere(`location.${field} = :${paramName}`, { [paramName]: clause.value });
            } else if (operator === '!=') {
              queryBuilder.andWhere(`location.${field} != :${paramName}`, { [paramName]: clause.value });
            }
          }
        });

        // Date filtering
        const created_on = whereClause.find((p: any) => p.key === 'created_on' && p.value);
        if (created_on) {
          const dateOnly = created_on.value.split(' ')[0];
          queryBuilder.andWhere('DATE(location.created_on) = :createdOnDate', { createdOnDate: dateOnly });
        }

        // "all" search across multiple fields
        const allValue = whereClause.find((p) => p.key === 'all')?.value;
        if (allValue) {
          const conditions = fieldsToSearch
            .map((field, index) => `location.${field} LIKE :allValue${index}`)
            .join(' OR ');
          const allParams = fieldsToSearch.reduce((acc, field, index) => {
            acc[`allValue${index}`] = `%${allValue}%`;
            return acc;
          }, {} as Record<string, string>);
          queryBuilder.andWhere(`(${conditions})`, allParams);
        }
      }

      const skip = (curPage - 1) * perPage;
      const orderDirection = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Determine sort field
      let orderByField = 'location.created_on';
      if (sortBy === 'locations_name') {
        orderByField = 'location.locations_name';
      } else if (sortBy === 'address') {
        orderByField = 'location.address';
      } else if (sortBy === 'status') {
        orderByField = 'location.status';
      } else if (sortBy === 'created_on') {
        orderByField = 'location.created_on';
      }

      const [list, count] = await queryBuilder
        .skip(skip)
        .take(perPage)
        .orderBy(orderByField, orderDirection)
        .getManyAndCount();

      // Calculate occupied slots for each location
      const locationIds = list.map((loc) => loc.id);
      let occupiedVehicles = [];
      
      if (locationIds.length > 0) {
        occupiedVehicles = await this.vehicleRepository
          .createQueryBuilder('vehicle')
          .where('vehicle.location_id IN (:...locationIds)', { locationIds })
          .andWhere('vehicle.check_out_time IS NULL')
          .andWhere('vehicle.is_deleted = :isDeleted', { isDeleted: false })
          .select(['vehicle.location_id'])
          .getMany();
      }

      const occupiedByLocation = occupiedVehicles.reduce((acc, vehicle) => {
        const locationId = vehicle.location_id;
        acc[locationId] = (acc[locationId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const data = list.map((location) => ({
        ...location,
        occupied_slots: occupiedByLocation[location.id] || 0,
      }));

      return paginateResponse(data, count, curPage, perPage);
    } catch (error) {
      console.error('Error in locations pagination:', error);
      throw error;
    }
  }

  async getLocationById(id: string) {
    const location = await this.locationRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['contractors'],
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const occupiedVehicles = await this.vehicleRepository.count({
      where: {
        location_id: id,
        check_out_time: null,
        is_deleted: false,
      },
    });

    return {
      ...location,
      occupied_slots: occupiedVehicles,
    };
  }

  async getContractorLocations(userId: string) {
    try {
      // Get contractor by user_id using repository
      const contractor = await this.contractorRepository.findOne({
        where: { user_id: userId, is_deleted: false },
      });

      if (!contractor || !contractor.id) {
        return [];
      }

      const contractorId = contractor.id;

      const locations = await this.locationRepository.find({
        where: {
          contractor_id: contractorId,
          is_deleted: false,
        },
        relations: ['contractors'],
        order: { created_on: 'DESC' },
      });

      if (!locations || locations.length === 0) {
        return [];
      }

      // Calculate occupied slots
      const locationIds = locations.map((loc) => loc.id);
      let occupiedVehicles = [];
      
      if (locationIds.length > 0) {
        occupiedVehicles = await this.vehicleRepository
          .createQueryBuilder('vehicle')
          .where('vehicle.location_id IN (:...locationIds)', { locationIds })
          .andWhere('vehicle.check_out_time IS NULL')
          .andWhere('vehicle.is_deleted = false')
          .select(['vehicle.location_id'])
          .getMany();
      }

      const occupiedByLocation = occupiedVehicles.reduce((acc, vehicle) => {
        const locationId = vehicle.location_id;
        acc[locationId] = (acc[locationId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return locations.map((location) => ({
        ...location,
        occupied_slots: occupiedByLocation[location.id] || 0,
      }));
    } catch (error) {
      console.error('Error in getContractorLocations:', error);
      throw error;
    }
  }

  async createLocation(data: CreateLocationDto, createdBy?: string, userRole?: UserRole): Promise<Location> {
    // Get contractor to validate limits
    const contractor = await this.contractorRepository.findOne({
      where: { id: data.contractor_id, is_deleted: false },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    // If contractor is creating, validate limits and ensure they're creating for themselves
    if (userRole === UserRole.CONTRACTOR && createdBy) {
      // Get contractor by user_id to verify it's the same contractor
      const loggedInContractor = await this.contractorRepository.findOne({
        where: { user_id: createdBy, is_deleted: false },
      });

      if (!loggedInContractor) {
        throw new ForbiddenException('Contractor not found');
      }

      // Ensure contractor is creating for themselves
      if (data.contractor_id !== loggedInContractor.id) {
        throw new ForbiddenException('You can only create locations for your own contractor account');
      }
    }

    // Check location limit for ALL users (including SUPER_ADMIN)
    const currentLocations = await this.locationRepository.count({
      where: { contractor_id: contractor.id, is_deleted: false },
    });

    const allowedLocations = contractor.allowed_locations || 0;
    if (currentLocations >= allowedLocations) {
      throw new BadRequestException(
        `This contractor has reached the maximum limit of ${allowedLocations} locations. Current locations: ${currentLocations}. Please update the contractor's allowed_locations limit to create more locations.`
      );
    }

    const locationId = randomUUID();
    const location = this.locationRepository.create({
      id: locationId,
      locations_name: data.locations_name,
      address: data.address,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      total_slots: data.total_slots,
      contractor_id: data.contractor_id,
      status: data.status || 'active',
      occupied_slots: 0,
      created_by: createdBy || null,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    const savedLocation = await this.locationRepository.save(location);
    return this.getLocationById(savedLocation.id);
  }

  async updateLocation(id: string, data: UpdateLocationDto, updatedBy?: string): Promise<Location> {
    const location = await this.getLocationById(id);

    if (data.locations_name !== undefined) location.locations_name = data.locations_name;
    if (data.address !== undefined) location.address = data.address;
    if (data.city !== undefined) location.city = data.city;
    if (data.state !== undefined) location.state = data.state;
    if (data.pincode !== undefined) location.pincode = data.pincode;
    if (data.total_slots !== undefined) location.total_slots = data.total_slots;
    if (data.contractor_id !== undefined) location.contractor_id = data.contractor_id;
    if (data.status !== undefined) location.status = data.status;
    location.updated_by = updatedBy || null;
    location.updated_on = new Date();

    await this.locationRepository.save(location);
    return this.getLocationById(id);
  }

  async deleteLocation(id: string, deletedBy?: string): Promise<void> {
    const location = await this.getLocationById(id);

    location.is_deleted = true;
    location.deleted_by = deletedBy || null;
    location.deleted_on = new Date();

    await this.locationRepository.save(location);
  }

  async getLocationStats(locationId: string) {
    const location = await this.getLocationById(locationId);

    // Get occupied slots
    const occupiedSlots = await this.vehicleRepository.count({
      where: {
        location_id: locationId,
        check_out_time: null,
        is_deleted: false,
      },
    });

    const totalSlots = location.total_slots || 0;
    const availableSlots = totalSlots - occupiedSlots;
    const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenueResult = await this.locationRepository.manager
      .createQueryBuilder()
      .select('SUM(payment.amount)', 'total')
      .from('payments', 'payment')
      .where('payment.location_id = :locationId', { locationId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .andWhere('payment.created_at >= :today', { today })
      .getRawOne();

    const todayRevenue = Number(todayRevenueResult?.total || 0);

    // Get total revenue
    const totalRevenueResult = await this.locationRepository.manager
      .createQueryBuilder()
      .select('SUM(payment.amount)', 'total')
      .from('payments', 'payment')
      .where('payment.location_id = :locationId', { locationId })
      .andWhere('payment.payment_status = :status', { status: 'completed' })
      .getRawOne();

    const totalRevenue = Number(totalRevenueResult?.total || 0);

    return {
      totalSlots,
      occupiedSlots,
      availableSlots,
      occupancyRate: Math.round(occupancyRate),
      todayRevenue,
      totalRevenue,
    };
  }

  async assignLocationToAttendant(attendantId: string, locationId: string) {
    // Verify location exists
    await this.getLocationById(locationId);

    // Update attendant's location
    await this.locationRepository.manager
      .createQueryBuilder()
      .update('attendants')
      .set({ location_id: locationId })
      .where('id = :attendantId', { attendantId })
      .execute();

    return { message: 'Location assigned to attendant successfully' };
  }

  async removeLocationFromAttendant(attendantId: string) {
    await this.locationRepository.manager
      .createQueryBuilder()
      .update('attendants')
      .set({ location_id: null })
      .where('id = :attendantId', { attendantId })
      .execute();

    return { message: 'Location removed from attendant successfully' };
  }

  async getAttendantLocations(attendantId: string) {
    const attendant = await this.locationRepository.manager
      .createQueryBuilder()
      .select('*')
      .from('attendants', 'attendant')
      .where('attendant.id = :attendantId', { attendantId })
      .andWhere('attendant.is_deleted = false')
      .getRawOne();

    if (!attendant || !attendant.location_id) {
      return [];
    }

    const location = await this.getLocationById(attendant.location_id);
    return [location];
  }
}
