import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('SUPABASE_DB_HOST'),
      port: parseInt(this.configService.get('SUPABASE_DB_PORT'), 10) || 5432,
      username: this.configService.get('SUPABASE_DB_USERNAME'),
      password: this.configService.get('SUPABASE_DB_PASSWORD'),
      database: this.configService.get('SUPABASE_DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') !== 'production',
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      logging: this.configService.get('NODE_ENV') === 'development',
    };
  }
}
