import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { ComisionesService } from '../services/comisiones.service';
import { CreateComisionDto } from '../dto/comision/create-comision.dto';
import { UpdateComisionDto } from '../dto/comision/update-comision.dto';
import { RevisarComisionDto } from '../dto/comision/revisar-comision.dto';
import { FindComisionesQueryDto } from '../dto/comision/find-comisiones-query.dto';
import { CalcularDestinoQueryDto } from '../dto/comision/calcular-destino-query.dto';

@Controller({
  path: 'procesos/comisiones',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  @Get()
  @ResponseMessage('Comisiones retrieved successfully.')
  findAll(@Query() query: FindComisionesQueryDto) {
    return this.comisionesService.findAll(query);
  }

  @Get('calcular-destino')
  @ResponseMessage('Destino calculated successfully.')
  calcularDestino(@Query() query: CalcularDestinoQueryDto) {
    return this.comisionesService.calcularDestino(query);
  }

  @Get('responsable/:actividadId')
  @ResponseMessage('Responsable retrieved successfully.')
  obtenerResponsable(
    @Param('actividadId', new ParseUUIDPipe()) actividadId: string,
  ) {
    return this.comisionesService.obtenerResponsable(actividadId);
  }

  @Get(':id')
  @ResponseMessage('Comision retrieved successfully.')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.comisionesService.findOne(id);
  }

  @Post()
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Comision created successfully.')
  create(
    @Body() dto: CreateComisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.create(dto, user);
  }

  @Patch(':id')
  @Roles(ViaticosRole.TRABAJADOR)
  @ResponseMessage('Comision updated successfully.')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateComisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.update(id, dto, user);
  }

  @Patch(':id/revisar')
  @Roles(ViaticosRole.DIRECTOR)
  @ResponseMessage('Comision reviewed successfully.')
  revisar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RevisarComisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.revisar(id, dto, user);
  }
}
