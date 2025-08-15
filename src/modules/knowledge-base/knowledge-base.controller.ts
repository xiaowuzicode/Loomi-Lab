import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { KnowledgeBaseStatus } from './entities/knowledge-base.entity';

@Controller('knowledge-base')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Post()
  create(@Body() createKnowledgeBaseDto: CreateKnowledgeBaseDto) {
    return this.knowledgeBaseService.create(createKnowledgeBaseDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('type') type?: string,
    @Query('status') status?: KnowledgeBaseStatus,
  ) {
    return this.knowledgeBaseService.findAll(
      parseInt(page),
      parseInt(limit),
      type,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeBaseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ) {
    return this.knowledgeBaseService.update(id, updateKnowledgeBaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeBaseService.remove(id);
  }

  @Post(':id/test-rag')
  testRAG(
    @Param('id') id: string,
    @Body('query') query: string,
  ) {
    return this.knowledgeBaseService.testRAG(id, query);
  }
}
