import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { NivelesAplicacionService } from '../services/niveles-aplicacion.service';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller({
  path: 'catalogos/niveles-aplicacion',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class NivelesAplicacionController {
  constructor(
    private readonly nivelesService: NivelesAplicacionService,
  ) {}

  @Get()
  @ResponseMessage('Niveles de aplicación retrieved successfully.')
  findAll() {
    return this.nivelesService.findAll();
  }
}
