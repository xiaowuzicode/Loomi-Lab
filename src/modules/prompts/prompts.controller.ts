import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PromptsService } from './prompts.service';

@Controller('prompts')
@UseGuards(AuthGuard('jwt'))
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  findAll() {
    return this.promptsService.findAll();
  }
}
