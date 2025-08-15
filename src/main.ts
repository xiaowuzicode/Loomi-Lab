import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 配置 CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true,
  });

  // API 路由前缀
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  await app.listen(port);
  console.log(`🚀 Loomi-Lab 后台管理平台启动成功！`);
  console.log(`📊 服务运行在: http://localhost:${port}`);
  console.log(`🎯 API 端点: http://localhost:${port}/api`);
}

bootstrap();
