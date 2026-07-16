import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    const token = this.extractBearerToken(
      request.headers.authorization,
    );

    const user = await this.authService.authenticate(token);

    request.user = user;

    return true;
  }

  private extractBearerToken(
    authorization?: string,
  ): string {
    if (!authorization) {
      throw new UnauthorizedException(
        'Authorization header not found.',
      );
    }

    const [type, token, ...extraParts] =
      authorization.trim().split(/\s+/);

    if (
      type?.toLowerCase() !== 'bearer' ||
      !token ||
      extraParts.length > 0
    ) {
      throw new UnauthorizedException(
        'A valid Bearer token is required.',
      );
    }

    return token;
  }
}