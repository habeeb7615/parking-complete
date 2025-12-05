import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import { Attendant } from '../entities/attendant.entity';
import { Location } from '../entities/location.entity';
import { Contractor } from '../entities/contractor.entity';
import { SubscriptionGuard } from './guards/subscription.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Attendant, Location, Contractor]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SubscriptionGuard],
  exports: [AuthService, JwtModule, SubscriptionGuard],
})
export class AuthModule {}

