import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Attendant } from '../entities/attendant.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Attendant)
    private attendantRepository: Repository<Attendant>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Contractor)
    private contractorRepository: Repository<Contractor>,
  ) {}

  async getProfile(userId: string) {
    try {
      const profile = await this.profileRepository
        .createQueryBuilder('profile')
        .where('profile.id = :userId', { userId })
        .andWhere('profile.is_deleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!profile) {
        return null;
      }

      // Check subscription status for contractor or attendant
      let subscriptionStatus = {
        is_subscription_active: true,
        subscription_blocked: false,
        subscription_status: null,
        subscription_end_date: null,
      };

      // SUPER_ADMIN doesn't need subscription check
      if (profile.role === UserRole.SUPER_ADMIN) {
        return {
          ...profile,
          subscription_status: subscriptionStatus,
        };
      }

      // Find the profile to check subscription for
      let profileToCheck: Profile | null = null;

      if (profile.role === UserRole.CONTRACTOR) {
        // For contractor, check their own subscription
        profileToCheck = await this.profileRepository.findOne({
          where: { id: userId, is_deleted: false },
          relations: ['subscription_plans'],
        });
      } else if (profile.role === UserRole.ATTENDANT) {
        // For attendant, check their contractor's subscription
        const attendant = await this.attendantRepository.findOne({
          where: { user_id: userId, is_deleted: false },
        });

        if (attendant && attendant.location_id) {
          const location = await this.locationRepository.findOne({
            where: { id: attendant.location_id, is_deleted: false },
          });

          if (location && location.contractor_id) {
            const contractor = await this.contractorRepository.findOne({
              where: { id: location.contractor_id, is_deleted: false },
            });

            if (contractor && contractor.user_id) {
              profileToCheck = await this.profileRepository.findOne({
                where: { id: contractor.user_id, is_deleted: false },
                relations: ['subscription_plans'],
              });
            }
          }
        }
      } else {
        // For any other role, check their own subscription
        profileToCheck = await this.profileRepository.findOne({
          where: { id: userId, is_deleted: false },
          relations: ['subscription_plans'],
        });
      }

      // Check subscription validity
      if (profileToCheck) {
        const now = new Date();
        const nowUTC = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        ));

        const endDate = profileToCheck.subscription_end_date
          ? new Date(profileToCheck.subscription_end_date)
          : null;

        const statusIsActive = profileToCheck.subscription_status?.toLowerCase() === 'active';
        const endDateExists = endDate !== null;
        const endDateInFuture = endDate ? endDate.getTime() > nowUTC.getTime() : false;

        const isSubscriptionValid = statusIsActive && endDateExists && endDateInFuture;

        subscriptionStatus = {
          is_subscription_active: isSubscriptionValid,
          subscription_blocked: !isSubscriptionValid,
          subscription_status: profileToCheck.subscription_status,
          subscription_end_date: profileToCheck.subscription_end_date,
        };
      }

      return {
        ...profile,
        subscription_status: subscriptionStatus,
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async createSuperAdmin(data: {
    user_name: string;
    email: string;
    password: string;
    phone_number?: string;
  }): Promise<Profile> {
    // Check if super admin already exists
    const existingSuperAdmin = await this.profileRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN, is_deleted: false },
    });

    if (existingSuperAdmin) {
      throw new ConflictException('Super Admin already exists. Only one super admin is allowed.');
    }

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

    // Create super admin profile
    const superAdmin = this.profileRepository.create({
      id: randomUUID(),
      user_name: data.user_name,
      email: data.email,
      password: hashedPassword,
      phone_number: data.phone_number || null,
      role: UserRole.SUPER_ADMIN,
      status: 'active',
      is_first_login: false,
      is_deleted: false,
      created_on: new Date(),
      updated_on: new Date(),
    });

    return this.profileRepository.save(superAdmin);
  }

  async getAllProfiles() {
    return this.profileRepository.find({
      where: { is_deleted: false },
      order: { created_on: 'DESC' },
    });
  }

  async getProfilesByRole(role: UserRole) {
    return this.profileRepository.find({
      where: { role, is_deleted: false },
      order: { created_on: 'DESC' },
    });
  }

  async updateProfile(userId: string, data: {
    user_name?: string;
    email?: string;
    phone_number?: string;
    contractor_name?: string;
    attendant_name?: string;
  }, updatedBy?: string) {
    // Fetch the actual Profile entity (not the extended object from getProfile)
    const profile = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.id = :userId', { userId })
      .andWhere('profile.is_deleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== profile.email) {
      const existingProfile = await this.profileRepository.findOne({
        where: { email: data.email, is_deleted: false },
      });

      if (existingProfile) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update profile fields
    if (data.user_name !== undefined) profile.user_name = data.user_name;
    if (data.email !== undefined) profile.email = data.email;
    if (data.phone_number !== undefined) profile.phone_number = data.phone_number;
    if (data.contractor_name !== undefined) profile.contractor_name = data.contractor_name;
    if (data.attendant_name !== undefined) profile.attendant_name = data.attendant_name;
    profile.updated_by = updatedBy || null;
    profile.updated_on = new Date();

    await this.profileRepository.save(profile);

    // If contractor_name is provided, update contractors table
    if (data.contractor_name) {
      await this.profileRepository.manager
        .createQueryBuilder()
        .update('contractors')
        .set({ company_name: data.contractor_name })
        .where('user_id = :userId', { userId })
        .execute();
    }

    return this.getProfile(userId);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const profile = await this.profileRepository
      .createQueryBuilder('profile')
      .select(['profile.id', 'profile.password', 'profile.is_first_login'])
      .where('profile.id = :userId', { userId })
      .andWhere('profile.is_deleted = false')
      .getOne();

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    // If it's first login, allow password update without old password verification
    if (profile.is_first_login) {
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and mark first login as complete
      await this.profileRepository.update(userId, {
        password: hashedPassword,
        is_first_login: false,
        updated_on: new Date(),
      });

      return { message: 'Password set successfully' };
    }

    // For subsequent password changes, verify old password
    if (!profile.password) {
      throw new BadRequestException('Password not set for this account');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, profile.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.profileRepository.update(userId, {
      password: hashedPassword,
      updated_on: new Date(),
    });

    return { message: 'Password changed successfully' };
  }

  async updateEmail(userId: string, newEmail: string) {
    // Fetch the actual Profile entity (not the extended object from getProfile)
    const profile = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.id = :userId', { userId })
      .andWhere('profile.is_deleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    // Check if email already exists
    const existingProfile = await this.profileRepository.findOne({
      where: { email: newEmail, is_deleted: false },
    });

    if (existingProfile && existingProfile.id !== userId) {
      throw new ConflictException('Email already exists');
    }

    // Update email
    profile.email = newEmail;
    profile.updated_on = new Date();

    await this.profileRepository.save(profile);

    return this.getProfile(userId);
  }
}

