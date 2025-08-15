import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KnowledgeBase, KnowledgeBaseStatus } from './entities/knowledge-base.entity';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private knowledgeBaseRepository: Repository<KnowledgeBase>,
  ) {}

  async create(createKnowledgeBaseDto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const knowledgeBase = this.knowledgeBaseRepository.create(createKnowledgeBaseDto);
    return this.knowledgeBaseRepository.save(knowledgeBase);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: string,
    status?: KnowledgeBaseStatus,
  ) {
    const queryBuilder = this.knowledgeBaseRepository.createQueryBuilder('kb');

    if (type) {
      queryBuilder.andWhere('kb.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('kb.status = :status', { status });
    }

    const [knowledgeBases, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('kb.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: knowledgeBases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<KnowledgeBase> {
    const knowledgeBase = await this.knowledgeBaseRepository.findOne({
      where: { id },
    });

    if (!knowledgeBase) {
      throw new NotFoundException(`知识库 ID ${id} 不存在`);
    }

    return knowledgeBase;
  }

  async update(id: string, updateKnowledgeBaseDto: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const knowledgeBase = await this.findOne(id);
    Object.assign(knowledgeBase, updateKnowledgeBaseDto);
    return this.knowledgeBaseRepository.save(knowledgeBase);
  }

  async remove(id: string): Promise<void> {
    const knowledgeBase = await this.findOne(id);
    await this.knowledgeBaseRepository.softRemove(knowledgeBase);
  }

  async testRAG(id: string, query: string) {
    // 模拟 RAG 召回测试
    // 实际应该调用 Milvus 进行向量检索
    const knowledgeBase = await this.findOne(id);
    
    // 模拟召回结果
    const mockResults = [
      {
        content: '这是一段相关的知识内容，与查询"' + query + '"高度相关。',
        similarity: 0.92,
        source: '文档1.pdf',
        metadata: { page: 1, section: '概述' },
      },
      {
        content: '另一段相关内容，提供了关于"' + query + '"的详细信息。',
        similarity: 0.87,
        source: '文档2.docx',
        metadata: { page: 3, section: '详细说明' },
      },
      {
        content: '第三段相关内容，包含了"' + query + '"的实际应用案例。',
        similarity: 0.81,
        source: '文档3.txt',
        metadata: { line: 45 },
      },
    ];

    return {
      knowledgeBaseId: id,
      knowledgeBaseName: knowledgeBase.name,
      query,
      results: mockResults,
      totalResults: mockResults.length,
      searchTime: Math.random() * 100 + 50, // 模拟搜索时间 (ms)
    };
  }
}
