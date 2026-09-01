import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';


import { ViaticosRole } from 'src/modules/auth/enums/viaticos-role.enum';

import { ActividadesService } from '../services/actividades.service';
import { FindActividadesQueryDto } from '../dto/actividad/find-actividades-query.dto';

@Controller({
  path: 'catalogos/actividades',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ActividadesController {
  constructor(
    private readonly actividadesService:
      ActividadesService,
  ) {}

    @Get()
    @Roles(
    ViaticosRole.ACCESO,
    )
    @ResponseMessage(
    'Activities retrieved successfully.',
    )
    findAll(
    @Query()
    query: FindActividadesQueryDto,
    ) {
    return this.actividadesService.findAll(
        query,
    );
    }



  @Post('sincronizar')
  @Roles(
    ViaticosRole.ADMIN,
  )
  @ResponseMessage(
    'Activities synchronized successfully.',
  )
  sync(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.actividadesService.sync(
      user,
    );
  }
}