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

import { MunicipiosService } from '../services/municipios.service';

import { CreateMunicipioDto } from '../dto/municipio/create-municipio.dto';
import { UpdateMunicipioDto } from '../dto/municipio/update-municipio.dto';
import { FindMunicipiosQueryDto } from '../dto/municipio/find-municipios-query.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';

@Controller({
  path: 'catalogos/municipios',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class MunicipiosController {
  constructor(
    private readonly municipiosService: MunicipiosService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Municipios retrieved successfully.')
  findAll(
    @Query() query: FindMunicipiosQueryDto,
  ) {
    return this.municipiosService.findAll(query);
  }

  @Get(':id')
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Municipio retrieved successfully.')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.municipiosService.findOne(id);
  }

  @Post()
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Municipio created successfully.')
  create(
    @Body() createMunicipioDto: CreateMunicipioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.municipiosService.create(
      createMunicipioDto,
      user.id,
    );
  }

  @Patch(':id')
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Municipio updated successfully.')
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    updateMunicipioDto: UpdateMunicipioDto,

    @CurrentUser() user: AuthenticatedUser,

    @Query('mode') mode?: 'assign' | 'edit',
  ) {
    return this.municipiosService.update(
      id,
      updateMunicipioDto,
      user.id,
      mode,
    );
  }
}
