import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { BorradorComisionDto } from '../dto/comision/borrador-comision.dto';
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
  findAll(
    @Query() query: FindComisionesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.findAll(query, user);
  }

  @Get('conteo')
  @ResponseMessage('Conteo retrieved successfully.')
  conteoPorEstado(@CurrentUser() user: AuthenticatedUser) {
    return this.comisionesService.conteoPorEstado(user);
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
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.findOne(id, user);
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

  @Post('borradores')
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Borrador created successfully.')
  crearBorrador(
    @Body() dto: BorradorComisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.crearBorrador(dto, user);
  }

  @Put(':id/borrador')
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Borrador saved successfully.')
  guardarBorrador(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BorradorComisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.guardarBorrador(id, dto, user);
  }

  @Patch(':id/enviar')
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Comision sent successfully.')
  enviarBorrador(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.enviarBorrador(id, user);
  }

  // Sólo borradores; una comisión enviada se cancela, no se elimina.
  @Delete(':id')
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Borrador deleted successfully.')
  eliminarBorrador(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.eliminarBorrador(id, user);
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

  @Patch(':id/cancelar')
  @Roles(ViaticosRole.DIRECTOR, ViaticosRole.TRABAJADOR)
  @ResponseMessage('Comision cancelled successfully.')
  cancelar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comisionesService.cancelar(id, user);
  }
}
