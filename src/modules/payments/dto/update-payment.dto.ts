import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @IsEnum(PaymentStatus, { message: '支付状态不正确' })
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
