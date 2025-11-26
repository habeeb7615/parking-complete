import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 'Downtown Parking', required: false })
  @IsString()
  @IsOptional()
  locations_name?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

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

  @ApiProperty({ example: 50, required: false })
  @IsNumber({}, { message: 'Total slots must be a number' })
  @IsOptional()
  @Min(0, { message: 'Total slots must be greater than or equal to 0' })
  total_slots?: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsString()
  @IsOptional()
  contractor_id?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

