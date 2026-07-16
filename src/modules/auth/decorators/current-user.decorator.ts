import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser => {
    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);