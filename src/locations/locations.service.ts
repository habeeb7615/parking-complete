import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Attendant } from '../entities/attendant.entity';
import { Contractor } from '../entities/contractor.entity';
import { PaginationParams, PaginatedResponse } from '../contractors/contractors.service';
import { randomUUID } from 'crypto';

export interface CreateLocationData {
  locations_name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  total_slots: number;
  contractor_id: string;
  status?: string;
}

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

  async createLocation(data: CreateLocationData, createdBy?: string): Promise<Location> {
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

  async updateLocation(id: string, data: Partial<CreateLocationData>, updatedBy?: string): Promise<Location> {
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
