import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

import { ViaticosRole } from '../enums/viaticos-role.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(ViaticosRole.ADMIN)
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): AuthenticatedUser {
    return user;
  }
}