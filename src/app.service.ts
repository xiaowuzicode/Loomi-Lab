import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthCheck(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Loomi-Lab 后台管理平台',
      version: '1.0.0',
    };
  }

  getVersion(): object {
    return {
      name: 'Loomi-Lab',
      version: '1.0.0',
      description: '基于 NestJS 的全栈后台管理平台，用于管理面向社媒的多智能体系统',
      tech_stack: {
        backend: 'NestJS',
        frontend: 'React + Vite + Chakra UI + Tailwind CSS',
        database: 'Supabase PostgreSQL',
        cache: 'Redis',
        vector_db: 'Milvus',
      },
    };
  }
}
