import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Profile } from '../entities/profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const profile = await this.profileRepository
        .createQueryBuilder('profile')
        .select([
          'profile.id',
          'profile.user_name',
          'profile.email',
          'profile.role',
          'profile.status',
          'profile.password',
          'profile.is_deleted',
        ])
        .where('profile.email = :email', { email })
        .andWhere('profile.is_deleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!profile) {
        return null;
      }

      // If profile has no password (legacy/migrated accounts), reject login
      // Password is required for authentication
      if (!profile.password) {
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, profile.password);
      if (!isPasswordValid) {
        return null;
      }

      // Remove password from returned object
      const { password: _, ...userWithoutPassword } = profile;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        user_name: user.user_name,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const profile = await this.profileRepository.findOne({
        where: { id: decoded.sub, is_deleted: false },
      });
      return profile;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getProfile(userId: string): Promise<Profile> {
    return this.profileRepository.findOne({
      where: { id: userId, is_deleted: false },
    });
  }
}

