import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsNotEmpty, IsOptional, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class Rates2WheelerDto {
  @ApiProperty({ example: 2 })
  @IsNumber({}, { message: 'upTo2Hours must be a number' })
  @IsNotEmpty({ message: 'upTo2Hours is required' })
  @Min(0, { message: 'upTo2Hours must be greater than or equal to 0' })
  upTo2Hours: number;

  @ApiProperty({ example: 5 })
  @IsNumber({}, { message: 'upTo6Hours must be a number' })
  @IsNotEmpty({ message: 'upTo6Hours is required' })
  @Min(0, { message: 'upTo6Hours must be greater than or equal to 0' })
  upTo6Hours: number;

  @ApiProperty({ example: 8 })
  @IsNumber({}, { message: 'upTo12Hours must be a number' })
  @IsNotEmpty({ message: 'upTo12Hours is required' })
  @Min(0, { message: 'upTo12Hours must be greater than or equal to 0' })
  upTo12Hours: number;

  @ApiProperty({ example: 12 })
  @IsNumber({}, { message: 'upTo24Hours must be a number' })
  @IsNotEmpty({ message: 'upTo24Hours is required' })
  @Min(0, { message: 'upTo24Hours must be greater than or equal to 0' })
  upTo24Hours: number;
}

class Rates4WheelerDto {
  @ApiProperty({ example: 5 })
  @IsNumber({}, { message: 'upTo2Hours must be a number' })
  @IsNotEmpty({ message: 'upTo2Hours is required' })
  @Min(0, { message: 'upTo2Hours must be greater than or equal to 0' })
  upTo2Hours: number;

  @ApiProperty({ example: 10 })
  @IsNumber({}, { message: 'upTo6Hours must be a number' })
  @IsNotEmpty({ message: 'upTo6Hours is required' })
  @Min(0, { message: 'upTo6Hours must be greater than or equal to 0' })
  upTo6Hours: number;

  @ApiProperty({ example: 18 })
  @IsNumber({}, { message: 'upTo12Hours must be a number' })
  @IsNotEmpty({ message: 'upTo12Hours is required' })
  @Min(0, { message: 'upTo12Hours must be greater than or equal to 0' })
  upTo12Hours: number;

  @ApiProperty({ example: 30 })
  @IsNumber({}, { message: 'upTo24Hours must be a number' })
  @IsNotEmpty({ message: 'upTo24Hours is required' })
  @Min(0, { message: 'upTo24Hours must be greater than or equal to 0' })
  upTo24Hours: number;
}

export class CreateContractorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty({ message: 'User name is required' })
  user_name: string;

  @ApiProperty({ example: 'contractor@example.com' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'ABC Parking Solutions' })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  company_name: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'Contact number is required' })
  contact_number: string;

  @ApiProperty({ example: 5 })
  @IsNumber({}, { message: 'Allowed locations must be a number' })
  @IsNotEmpty({ message: 'Allowed locations is required' })
  @Min(0, { message: 'Allowed locations must be greater than or equal to 0' })
  allowed_locations: number;

  @ApiProperty({ example: 3 })
  @IsNumber({}, { message: 'Allowed attendants per location must be a number' })
  @IsNotEmpty({ message: 'Allowed attendants per location is required' })
  @Min(0, { message: 'Allowed attendants per location must be greater than or equal to 0' })
  allowed_attendants_per_location: number;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'], required: false })
  @IsEnum(['active', 'inactive'], { message: 'Status must be either active or inactive' })
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiProperty({ type: Rates2WheelerDto })
  @ValidateNested()
  @Type(() => Rates2WheelerDto)
  @IsNotEmpty({ message: 'Rates for 2-wheeler is required' })
  rates_2wheeler: Rates2WheelerDto;

  @ApiProperty({ type: Rates4WheelerDto })
  @ValidateNested()
  @Type(() => Rates4WheelerDto)
  @IsNotEmpty({ message: 'Rates for 4-wheeler is required' })
  rates_4wheeler: Rates4WheelerDto;
}

