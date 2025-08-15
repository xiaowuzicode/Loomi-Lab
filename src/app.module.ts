import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

// 配置模块
import { DatabaseConfig } from './config/database.config';
import { AppConfig } from './config/app.config';

// 核心模块
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ContentLibraryModule } from './modules/content-library/content-library.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { XiaohongshuModule } from './modules/xiaohongshu/xiaohongshu.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';

// 应用控制器
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 全局配置
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig, DatabaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // 静态文件服务 (为前端 SPA 提供服务)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),

    // 请求频率限制
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1分钟
      limit: 100, // 最多100次请求
    }]),

    // 数据库连接
    TypeOrmModule.forRootAsync({
      useFactory: (config: DatabaseConfig) => config.createTypeOrmOptions(),
      inject: [DatabaseConfig],
    }),

    // 业务模块
    AuthModule,
    UsersModule,
    PaymentsModule,
    DashboardModule,
    KnowledgeBaseModule,
    ContentLibraryModule,
    PromptsModule,
    XiaohongshuModule,
    SystemConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseConfig],
})
export class AppModule {}
