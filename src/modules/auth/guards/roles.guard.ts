import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../constants/auth.constants';
import { ViaticosRole } from '../enums/viaticos-role.enum';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { ErrorCode } from 'src/common/exceptions/error-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<ViaticosRole[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    /*
     * Si el endpoint no declara @Roles(),
     * este Guard no impone ninguna restricción adicional.
     */
    if (!requiredRoles?.length) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    /*
     * RolesGuard debe ejecutarse después de JwtAuthGuard.
     * Si no existe request.user, la autenticación no ocurrió.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Authenticated user was not found.',
      );
    }

    const userRoles = Array.isArray(user.rolesViaticos)
      ? user.rolesViaticos
      : [];

    const hasRequiredRole = requiredRoles.some(
      (requiredRole) =>
        userRoles.includes(requiredRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException({
        error: {
          code: ErrorCode.INSUFFICIENT_PERMISSIONS,
          message: `Tu usuario no tiene el rol necesario para esta acción. Se requiere: ${requiredRoles.join(', ')}. Tus roles: ${userRoles.join(', ') || 'ninguno'}.`,
          details: [],
        },
      });
    }

    return true;
  }
}