import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { CurrentToken } from 'src/modules/auth/decorators/current-token.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ViaticosRole } from './../../auth/enums/viaticos-role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { PlantelesService } from '../services/planteles.service';

@Controller({
  path: 'catalogos/planteles',
  version: '1',
})
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class PlantelesController {
  constructor(
    private readonly plantelesService:
      PlantelesService,
  ) {}

  @Get()
  @Roles(ViaticosRole.ACCESO)
  @ResponseMessage(
    'Plantels retrieved successfully.',
  )
  findAll() {
    return this.plantelesService.findAll();
  }

  @Post('sincronizar')
  @Roles(
    ViaticosRole.ADMIN
  )
  @ResponseMessage(
    'Plantels synchronized successfully.',
  )
  sync(
    @CurrentToken()
    token: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.plantelesService.sync(
      token,
      user,
    );
  }
}