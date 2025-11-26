import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({
    description: 'Contractor ID to assign subscription to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty({ message: 'Contractor ID is required' })
  contractorId: string;

  @ApiProperty({
    description: 'Subscription plan ID to assign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty({ message: 'Plan ID is required' })
  planId: string;

  @ApiProperty({
    description: 'Duration in days (optional, defaults to plan days)',
    example: 30,
    required: false,
  })
  @IsNumber({}, { message: 'Duration days must be a number' })
  @IsOptional()
  @Min(1, { message: 'Duration days must be at least 1' })
  durationDays?: number;
}

