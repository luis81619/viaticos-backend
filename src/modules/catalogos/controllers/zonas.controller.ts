import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZonasService } from '../services/zonas.service';
import { FindZonasQueryDto } from '../dto/zona/find-zonas-query.dto';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';

@Controller({
  path: 'catalogos/zonas',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonasController {
  constructor(
    private readonly zonasService: ZonasService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage('Zonas retrieved successfully.')
  findAll(
    @Query() query: FindZonasQueryDto,
  ) {
    return this.zonasService.findAll(query);
  }
}
