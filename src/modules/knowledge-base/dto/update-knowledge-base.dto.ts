import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateKnowledgeBaseDto } from './create-knowledge-base.dto';
import { KnowledgeBaseStatus } from '../entities/knowledge-base.entity';

export class UpdateKnowledgeBaseDto extends PartialType(CreateKnowledgeBaseDto) {
  @IsOptional()
  @IsEnum(KnowledgeBaseStatus, { message: '知识库状态不正确' })
  status?: KnowledgeBaseStatus;
}
