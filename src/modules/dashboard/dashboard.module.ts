import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [UsersModule, PaymentsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
