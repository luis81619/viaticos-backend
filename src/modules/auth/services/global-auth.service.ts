import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { GlobalAuthUser } from '../interfaces/global-auth-user.interface';

@Injectable()
export class GlobalAuthService {
  private readonly authCheckUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authCheckUrl =
      this.configService.getOrThrow<string>(
        'GLOBAL_AUTH_CHECK_URL',
      );
  }

  async validateToken(
    token: string,
  ): Promise<GlobalAuthUser> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GlobalAuthUser>(
          this.authCheckUrl,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data) {
        throw new UnauthorizedException(
          'Authentication service returned an invalid response.',
        );
      }

      return response.data;
    } catch (error: unknown) {
      return this.handleAuthError(error);
    }
  }

  private handleAuthError(error: unknown): never {
    if (error instanceof UnauthorizedException) {
      throw error;
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === HttpStatus.UNAUTHORIZED) {
        throw new UnauthorizedException(
          'The authentication token is invalid or has expired.',
        );
      }

      if (status === HttpStatus.FORBIDDEN) {
        throw new HttpException(
          'The user is not authorized to access this application.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED'
      ) {
        throw new HttpException(
          'The authentication service is temporarily unavailable.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    throw new HttpException(
      'Unable to validate the authentication session.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}