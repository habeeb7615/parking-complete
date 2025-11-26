import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  @IsNotEmpty({ message: 'User name is required' })
  user_name: string;

  @ApiProperty({ example: 'admin@parkflow.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Admin@123', description: 'Password for super admin account' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;
}

