import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Name of the subscription plan',
    example: 'Primimum',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Price of the subscription plan',
    example: 500,
    required: false,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsOptional()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number;

  @ApiProperty({
    description: 'Duration of the subscription plan in days',
    example: 28,
    required: false,
  })
  @IsNumber({}, { message: 'Days must be a number' })
  @IsOptional()
  @Min(1, { message: 'Days must be at least 1' })
  days?: number;
}

