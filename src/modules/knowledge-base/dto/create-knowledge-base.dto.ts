import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { KnowledgeBaseType } from '../entities/knowledge-base.entity';

export class CreateKnowledgeBaseDto {
  @IsString({ message: '知识库名称必须是字符串' })
  name: string;

  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsEnum(KnowledgeBaseType, { message: '知识库类型不正确' })
  type?: KnowledgeBaseType;

  @IsOptional()
  @IsObject({ message: '配置必须是对象' })
  config?: {
    chunkSize?: number;
    overlap?: number;
    embeddingModel?: string;
    similarity_threshold?: number;
  };

  @IsOptional()
  @IsObject({ message: '元数据必须是对象' })
  metadata?: Record<string, any>;
}
