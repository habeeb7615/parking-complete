import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Downtown Parking' })
  @IsString()
  @IsNotEmpty({ message: 'Location name is required' })
  locations_name: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '10001', required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ example: 50 })
  @IsNumber({}, { message: 'Total slots must be a number' })
  @IsNotEmpty({ message: 'Total slots is required' })
  @Min(0, { message: 'Total slots must be greater than or equal to 0' })
  total_slots: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty({ message: 'Contractor ID is required' })
  contractor_id: string;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

