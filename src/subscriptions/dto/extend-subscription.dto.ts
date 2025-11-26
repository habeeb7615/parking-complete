import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ExtendSubscriptionDto {
  @ApiProperty({
    description: 'Additional days to extend the subscription',
    example: 30,
  })
  @IsNumber({}, { message: 'Additional days must be a number' })
  @IsNotEmpty({ message: 'Additional days is required' })
  @Min(1, { message: 'Additional days must be at least 1' })
  additionalDays: number;
}

