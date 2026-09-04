import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { ZonificacionService } from '../services/zonificacion.service';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';

@Controller({
  path: 'catalogos/zonificacion',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonificacionController {
  constructor(
    private readonly zonificacionService: ZonificacionService,
  ) {}

  @Get('estados')
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Zonificación retrieved successfully.')
  listarPorEstado() {
    return this.zonificacionService.listarPorEstado();
  }
}
