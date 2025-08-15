import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const orderNumber = this.generateOrderNumber();
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      orderNumber,
    });
    return this.paymentRepository.save(payment);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: PaymentStatus,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [payments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException(`支付记录 ID ${id} 不存在`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async getPaymentStats() {
    const total = await this.paymentRepository.count();
    const success = await this.paymentRepository.count({
      where: { status: PaymentStatus.SUCCESS },
    });
    
    // 总收入
    const totalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    // 最近30天收入
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('payment.createdAt >= :startDate', { startDate: thirtyDaysAgo })
      .getRawOne();

    return {
      total,
      success,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      monthlyRevenue: parseFloat(monthlyRevenue.total) || 0,
      successRate: total > 0 ? (success / total * 100).toFixed(2) : 0,
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LM${timestamp}${random}`;
  }
}
