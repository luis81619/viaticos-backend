import { Controller, Get, UseGuards } from '@nestjs/common';

import { ZonasService } from '../services/zonas.service';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller({
  path: 'catalogos/zonas',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Get()
  @ResponseMessage('Zonas retrieved successfully.')
  findAll() {
    return this.zonasService.findAll();
  }
}
