import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';

import { TabuladorService } from '../services/tabulador.service';
import { ActualizarTabuladorDto } from '../dto/tabulador/actualizar-tabulador.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';

@Controller({
  path: 'catalogos/tabulador',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class TabuladorController {
  constructor(
    private readonly tabuladorService: TabuladorService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Tabulador retrieved successfully.')
  listar() {
    return this.tabuladorService.listar();
  }

  @Put()
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Tabulador updated successfully.')
  actualizar(
    @Body() dto: ActualizarTabuladorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tabuladorService.actualizarMasivo(dto, user.id);
  }
}
