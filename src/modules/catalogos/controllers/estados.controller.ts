import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { EstadosService } from '../services/estados.service';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';

@Controller({
  path: 'catalogos/estados',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstadosController {
  constructor(
    private readonly estadosService: EstadosService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Estados retrieved successfully.')
  findAll() {
    return this.estadosService.findAll();
  }
}
