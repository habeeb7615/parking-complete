import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class UpdateAttendantDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty({ example: 'attendant@example.com', required: false })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Password123!', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsString()
  @IsOptional()
  location_id?: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'], required: false })
  @IsEnum(['active', 'inactive'], { message: 'Status must be either active or inactive' })
  @IsOptional()
  status?: 'active' | 'inactive';
}

