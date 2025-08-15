import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID(4, { message: '用户ID格式不正确' })
  userId: string;

  @IsNumber({}, { message: '支付金额必须是数字' })
  @Min(0.01, { message: '支付金额必须大于0.01' })
  amount: number;

  @IsEnum(PaymentMethod, { message: '支付方式不正确' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
