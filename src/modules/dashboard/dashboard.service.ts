import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DashboardService {
  constructor(
    private usersService: UsersService,
    private paymentsService: PaymentsService,
  ) {}

  async getOverviewStats() {
    const [userStats, paymentStats] = await Promise.all([
      this.usersService.getUserStats(),
      this.paymentsService.getPaymentStats(),
    ]);

    // 模拟 DAU 数据 (实际应该从用户活动日志中获取)
    const dau = Math.floor(Math.random() * 1000) + 500;
    
    // 模拟 Token 消耗数据 (实际应该从 AI 服务调用记录中获取)
    const tokenConsumption = Math.floor(Math.random() * 100000) + 50000;

    return {
      // 核心指标
      dau,
      newUsers: userStats.newUsers,
      totalTokenConsumption: tokenConsumption,
      totalRevenue: paymentStats.totalRevenue,
      
      // 用户统计
      userStats: {
        total: userStats.total,
        active: userStats.active,
        inactive: userStats.inactive,
        banned: userStats.banned,
        newUsers: userStats.newUsers,
      },
      
      // 支付统计
      paymentStats: {
        total: paymentStats.total,
        success: paymentStats.success,
        totalRevenue: paymentStats.totalRevenue,
        monthlyRevenue: paymentStats.monthlyRevenue,
        successRate: paymentStats.successRate,
      },
    };
  }

  async getUserActivityTrend(days: number = 30) {
    // 模拟用户活跃度趋势数据
    // 实际应该从用户活动日志表中查询
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const baseValue = 800;
      const randomVariation = Math.floor(Math.random() * 400) - 200;
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor((baseValue + randomVariation) * weekendFactor),
      });
    }
    
    return data;
  }

  async getTokenConsumptionStats() {
    // 模拟 Token 消耗统计数据
    // 实际应该从 AI 服务调用记录中查询
    return {
      totalConsumption: 1234567,
      monthlyConsumption: 89123,
      dailyAverage: 2970,
      topConsumers: [
        { category: '文案生成', consumption: 45000, percentage: 36 },
        { category: '评论回复', consumption: 32000, percentage: 26 },
        { category: '内容分析', consumption: 28000, percentage: 22 },
        { category: '图像处理', consumption: 20000, percentage: 16 },
      ],
    };
  }

  async getRevenueAnalysis(months: number = 12) {
    // 模拟收入分析数据
    const data = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const baseRevenue = 50000;
      const growth = (months - i) * 0.1; // 模拟增长趋势
      const randomVariation = (Math.random() - 0.5) * 0.3;
      
      data.push({
        month: date.toISOString().slice(0, 7),
        revenue: Math.floor(baseRevenue * (1 + growth + randomVariation)),
        orders: Math.floor(Math.random() * 200) + 100,
      });
    }
    
    return data;
  }
}
