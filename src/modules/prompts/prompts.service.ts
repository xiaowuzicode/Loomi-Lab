import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptsService {
  // 提示词管理服务
  // 实际实现时需要连接数据库
  
  async findAll() {
    // 模拟提示词数据
    return {
      message: '提示词管理模块待实现',
      data: [],
    };
  }
}
