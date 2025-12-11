import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpCheckoutDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Vehicle ID' })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle ID is required' })
  vehicle_id: string;

  @ApiProperty({ example: '123456', description: 'OTP for verification' })
  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;
}

