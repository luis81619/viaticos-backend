import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { GlobalAuthService } from './global-auth.service';

import { ViaticosRole } from '../enums/viaticos-role.enum';

import { GlobalAuthUser } from '../interfaces/global-auth-user.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly globalAuthService: GlobalAuthService,
  ) {}

  /**
   * Valida el token mediante GLOBALCECYTEM y construye
   * el usuario autenticado interno de VIÁTICOS.
   */
  async authenticate(token: string): Promise<AuthenticatedUser> {
    const globalUser =
      await this.globalAuthService.validateToken(token);

    return this.buildAuthenticatedUser(globalUser);
  }

  /**
   * Convierte el contrato externo de GLOBALCECYTEM
   * al contrato interno utilizado por VIÁTICOS.
   */
  private buildAuthenticatedUser(
    globalUser: GlobalAuthUser,
  ): AuthenticatedUser {
    if (!globalUser) {
      throw new UnauthorizedException(
        'Authentication service returned an invalid user.',
      );
    }

    if (!globalUser.isActive) {
      throw new UnauthorizedException(
        'The authenticated user is inactive.',
      );
    }

    const rolesGlobal = Array.isArray(globalUser.roles)
      ? globalUser.roles
      : [];

    const rolesViaticos =
      this.extractViaticosRoles(rolesGlobal);

    if (!rolesViaticos.includes(ViaticosRole.ACCESO)) {
      throw new ForbiddenException(
        'The user does not have access to VIÁTICOS.',
      );
    }

    const permissions =
      this.buildPermissions(rolesViaticos);

    return {
      id: globalUser.user_id,

      email: globalUser.email,
      fullName: this.buildFullName(globalUser),
      numeroTrabajador:
        globalUser.numeroTrabajador?.toString() ?? '',

      isActive: globalUser.isActive,

      plantelId:
        globalUser.plantel?.plantel_id ??
        globalUser.plantelId,

      plantelNombre:
        globalUser.plantel?.plantel_nombre ?? '',

      cct:
        globalUser.plantel?.cct ?? '',

      tipoPlantel:
        globalUser.plantel?.tipo,

      modeloPlantel:
        globalUser.plantel?.modelo,

      rolesGlobal,
      rolesViaticos,
      permissions,

      isAdmin:
        rolesViaticos.includes(
          ViaticosRole.ADMIN,
        ),

      isDirector:
        rolesViaticos.includes(
          ViaticosRole.DIRECTOR,
        ),

      isTrabajador:
        rolesViaticos.includes(
          ViaticosRole.TRABAJADOR,
        ),

      tokenTimeLeft:
        globalUser.timeLeft,
    };
  }

  private extractViaticosRoles(
    roles: string[],
  ): ViaticosRole[] {
    const validRoles = new Set<string>(
      Object.values(ViaticosRole),
    );

    return roles.filter(
      (role): role is ViaticosRole =>
        validRoles.has(role),
    );
  }

  private buildFullName(
    globalUser: GlobalAuthUser,
  ): string {
    return [
      globalUser.nombres,
      globalUser.apell_Paterno,
      globalUser.apell_Materno,
    ]
      .filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0,
      )
      .map((value) => value.trim())
      .join(' ');
  }

  private buildPermissions(
    roles: ViaticosRole[],
  ): string[] {
    const permissions = new Set<string>();

    if (roles.includes(ViaticosRole.ACCESO)) {
      permissions.add('CATALOGOS_BANCOS_READ');
    }

    if (roles.includes(ViaticosRole.ADMIN)) {
      permissions.add('CATALOGOS_BANCOS_READ');
      permissions.add('CATALOGOS_BANCOS_CREATE');
      permissions.add('CATALOGOS_BANCOS_UPDATE');
    }

    if (roles.includes(ViaticosRole.DIRECTOR)) {
      permissions.add('SOLICITUDES_READ');
      permissions.add('SOLICITUDES_AUTHORIZE');
    }

    if (roles.includes(ViaticosRole.TRABAJADOR)) {
      permissions.add('SOLICITUDES_READ_OWN');
      permissions.add('SOLICITUDES_CREATE');
      permissions.add('COMPROBACIONES_CREATE');
    }

    return Array.from(permissions);
  }
}