import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateVehicleDto {
  @ApiProperty({ example: 'KA01AB1234', required: false })
  @IsString()
  @IsOptional()
  plate_number?: string;

  @ApiProperty({ example: '2-wheeler', required: false })
  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsString()
  @IsOptional()
  location_id?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsString()
  @IsOptional()
  contractor_id?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  mobile_number?: string;
}

