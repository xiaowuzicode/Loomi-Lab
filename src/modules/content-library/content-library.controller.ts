import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ContentLibraryService } from './content-library.service';

@Controller('content-library')
@UseGuards(AuthGuard('jwt'))
export class ContentLibraryController {
  constructor(private readonly contentLibraryService: ContentLibraryService) {}

  @Get()
  findAll() {
    return this.contentLibraryService.findAll();
  }
}
