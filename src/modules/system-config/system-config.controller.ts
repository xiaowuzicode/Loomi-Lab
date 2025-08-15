import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { SystemConfigService } from './system-config.service';

@Controller('system-config')
@UseGuards(AuthGuard('jwt'))
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  findAll() {
    return this.systemConfigService.findAll();
  }
}
