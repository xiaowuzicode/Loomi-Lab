import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { XiaohongshuService } from './xiaohongshu.service';

@Controller('xiaohongshu')
@UseGuards(AuthGuard('jwt'))
export class XiaohongshuController {
  constructor(private readonly xiaohongshuService: XiaohongshuService) {}

  @Get()
  findAll() {
    return this.xiaohongshuService.findAll();
  }
}
