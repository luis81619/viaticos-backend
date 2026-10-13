import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TrabajadoresService } from '../services/trabajadores.service';

import { FindTrabajadoresQueryDto } from '../dto/trabajador/find-trabajadores-query.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';

@Controller({
  path: 'catalogos/trabajadores',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajadoresController {
  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @Get()
  @ResponseMessage('Trabajadores retrieved successfully.')
  findAll(@Query() query: FindTrabajadoresQueryDto) {
    return this.trabajadoresService.findAll(query);
  }

  @Get('por-numero/:numero')
  @ResponseMessage('Trabajador retrieved successfully.')
  findByNumero(@Param('numero', ParseIntPipe) numero: number) {
    return this.trabajadoresService.findByNumero(numero);
  }

  @Post('sincronizar')
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Trabajadores synchronized successfully.')
  sync() {
    return this.trabajadoresService.sync();
  }
}
