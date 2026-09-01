import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const CurrentToken = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): string => {
    const request =
      context
        .switchToHttp()
        .getRequest<RequestWithUser>();

    if (!request.authToken) {
      throw new UnauthorizedException(
        'Authenticated token was not found.',
      );
    }

    return request.authToken;
  },
);