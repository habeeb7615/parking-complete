import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsEnum, Min } from 'class-validator';

export class CheckoutVehicleDto {
  @ApiProperty({ example: '2024-01-01T12:00:00.000Z', format: 'date-time' })
  @IsString()
  @IsNotEmpty({ message: 'Check out time is required' })
  check_out_time: string;

  @ApiProperty({ example: 25.00 })
  @IsNumber({}, { message: 'Payment amount must be a number' })
  @IsNotEmpty({ message: 'Payment amount is required' })
  @Min(0, { message: 'Payment amount must be greater than or equal to 0' })
  payment_amount: number;

  @ApiProperty({ example: 'cash', enum: ['cash', 'card', 'digital', 'free'], required: false })
  @IsEnum(['cash', 'card', 'digital', 'free'], { message: 'Payment method must be one of: cash, card, digital, free' })
  @IsOptional()
  payment_method?: 'cash' | 'card' | 'digital' | 'free';
}

