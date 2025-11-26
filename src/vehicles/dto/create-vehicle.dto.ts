import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'KA01AB1234' })
  @IsString()
  @IsNotEmpty({ message: 'Plate number is required' })
  plate_number: string;

  @ApiProperty({ example: '2-wheeler' })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle type is required' })
  vehicle_type: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty({ message: 'Location ID is required' })
  location_id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty({ message: 'Contractor ID is required' })
  contractor_id: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  mobile_number?: string;

  @ApiProperty({ example: 'gate-1', required: false })
  @IsString()
  @IsOptional()
  gate_in_id?: string;

  @ApiProperty({ example: 'session-123', required: false })
  @IsString()
  @IsOptional()
  session_id?: string;
}

