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

import { BancosService } from '../services/bancos.service';

import { CreateBancoDto } from '../dto/banco/create-banco.dto';
import { UpdateBancoDto } from '../dto/banco/update-banco.dto';
import { FindBancosQueryDto } from '../dto/banco/find-bancos-query.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';

@Controller({
  path: 'catalogos/bancos',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class BancosController {
  constructor(
    private readonly bancosService: BancosService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Banks retrieved successfully.')
  findAll(
    @Query() query: FindBancosQueryDto,
  ) {
    return this.bancosService.findAll(query);
  }

  @Get(':id')
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Bank retrieved successfully.')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.bancosService.findOne(id);
  }

  @Post()
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Bank created successfully.')
  create(
    @Body() createBancoDto: CreateBancoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bancosService.create(
      createBancoDto,
      user.id
    );
  }

  @Patch(':id')
  @Roles(ViaticosRole.ADMIN)
  @ResponseMessage('Bank updated successfully.')
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    updateBancoDto: UpdateBancoDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.bancosService.update(
      id,
      updateBancoDto,
      user.id,
    );
  }
}
