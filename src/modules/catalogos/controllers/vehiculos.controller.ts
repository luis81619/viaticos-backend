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

import { VehiculosService } from '../services/vehiculos.service';

import { CreateVehiculoDto } from '../dto/vehiculo/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/vehiculo/update-vehiculo.dto';
import { FindVehiculosQueryDto } from '../dto/vehiculo/find-vehiculos-query.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';

@Controller({
  path: 'catalogos/vehiculos',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosController {
  constructor(
    private readonly vehiculosService: VehiculosService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Vehicles retrieved successfully.')
  findAll(
    @Query() query: FindVehiculosQueryDto,
  ) {
    return this.vehiculosService.findAll(query);
  }

  @Get(':id')
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Vehicle retrieved successfully.')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.vehiculosService.findOne(id);
  }

  @Post()
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Vehicle created successfully.')
  create(
    @Body() createVehiculoDto: CreateVehiculoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehiculosService.create(
      createVehiculoDto,
      user.id,
    );
  }

  @Patch(':id')
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Vehicle updated successfully.')
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    updateVehiculoDto: UpdateVehiculoDto,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehiculosService.update(
      id,
      updateVehiculoDto,
      user.id,
    );
  }
}
