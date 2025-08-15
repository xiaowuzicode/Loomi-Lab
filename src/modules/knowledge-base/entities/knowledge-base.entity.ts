import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum KnowledgeBaseType {
  PERSONA = 'persona',
  GENERAL = 'general',
  DOMAIN_SPECIFIC = 'domain_specific',
}

export enum KnowledgeBaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
}

@Entity('knowledge_bases')
export class KnowledgeBase extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: KnowledgeBaseType,
    default: KnowledgeBaseType.GENERAL,
  })
  type: KnowledgeBaseType;

  @Column({
    type: 'enum',
    enum: KnowledgeBaseStatus,
    default: KnowledgeBaseStatus.ACTIVE,
  })
  status: KnowledgeBaseStatus;

  @Column({ type: 'int', default: 0 })
  documentCount: number;

  @Column({ type: 'int', default: 0 })
  vectorCount: number;

  @Column({ type: 'jsonb', nullable: true })
  config?: {
    chunkSize?: number;
    overlap?: number;
    embeddingModel?: string;
    similarity_threshold?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastTrainedAt?: Date;
}
