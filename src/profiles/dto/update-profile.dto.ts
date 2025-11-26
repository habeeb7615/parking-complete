import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'ABC Company', required: false })
  @IsString()
  @IsOptional()
  contractor_name?: string;

  @ApiProperty({ example: 'Attendant Name', required: false })
  @IsString()
  @IsOptional()
  attendant_name?: string;
}

