import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Name of the subscription plan',
    example: 'Primimum',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'Price of the subscription plan',
    example: 500,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiProperty({
    description: 'Duration of the subscription plan in days',
    example: 28,
  })
  @IsNumber({}, { message: 'Days must be a number' })
  @IsNotEmpty({ message: 'Days is required' })
  @Min(1, { message: 'Days must be at least 1' })
  days: number;
}

