import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsOptional, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class Rates2WheelerDto {
  @ApiProperty({ example: 2, required: false })
  @IsNumber({}, { message: 'upTo2Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo2Hours must be greater than or equal to 0' })
  upTo2Hours?: number;

  @ApiProperty({ example: 5, required: false })
  @IsNumber({}, { message: 'upTo6Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo6Hours must be greater than or equal to 0' })
  upTo6Hours?: number;

  @ApiProperty({ example: 8, required: false })
  @IsNumber({}, { message: 'upTo12Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo12Hours must be greater than or equal to 0' })
  upTo12Hours?: number;

  @ApiProperty({ example: 12, required: false })
  @IsNumber({}, { message: 'upTo24Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo24Hours must be greater than or equal to 0' })
  upTo24Hours?: number;
}

class Rates4WheelerDto {
  @ApiProperty({ example: 5, required: false })
  @IsNumber({}, { message: 'upTo2Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo2Hours must be greater than or equal to 0' })
  upTo2Hours?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber({}, { message: 'upTo6Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo6Hours must be greater than or equal to 0' })
  upTo6Hours?: number;

  @ApiProperty({ example: 18, required: false })
  @IsNumber({}, { message: 'upTo12Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo12Hours must be greater than or equal to 0' })
  upTo12Hours?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber({}, { message: 'upTo24Hours must be a number' })
  @IsOptional()
  @Min(0, { message: 'upTo24Hours must be greater than or equal to 0' })
  upTo24Hours?: number;
}

export class UpdateContractorDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty({ example: 'contractor@example.com', required: false })
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

  @ApiProperty({ example: 'ABC Parking Solutions', required: false })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  contact_number?: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber({}, { message: 'Allowed locations must be a number' })
  @IsOptional()
  @Min(0, { message: 'Allowed locations must be greater than or equal to 0' })
  allowed_locations?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber({}, { message: 'Allowed attendants per location must be a number' })
  @IsOptional()
  @Min(0, { message: 'Allowed attendants per location must be greater than or equal to 0' })
  allowed_attendants_per_location?: number;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'], required: false })
  @IsEnum(['active', 'inactive'], { message: 'Status must be either active or inactive' })
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiProperty({ type: Rates2WheelerDto, required: false })
  @ValidateNested()
  @Type(() => Rates2WheelerDto)
  @IsOptional()
  rates_2wheeler?: Rates2WheelerDto;

  @ApiProperty({ type: Rates4WheelerDto, required: false })
  @ValidateNested()
  @Type(() => Rates4WheelerDto)
  @IsOptional()
  rates_4wheeler?: Rates4WheelerDto;
}

