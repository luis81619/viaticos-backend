import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Reflector } from '@nestjs/core';


import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { ApiResponse } from '../interfaces/api-response.interfaces';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {

    const httpContext = context.switchToHttp();

    const response = httpContext.getResponse();

    const statusCode = response.statusCode;

    const message =
      this.reflector.get<string>(
        RESPONSE_MESSAGE_KEY,
        context.getHandler(),
      ) || 'Request processed successfully.';

    return next.handle().pipe(
      map((data) => {

        /*
        |--------------------------------------------------------------------------
        | PAGINATED RESPONSE
        |--------------------------------------------------------------------------
        */

        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return {
            success: true,
            status: statusCode,
            message,
            data: data.data,
            meta: data.meta,
          };
        }

        /*
        |--------------------------------------------------------------------------
        | NORMAL RESPONSE
        |--------------------------------------------------------------------------
        */

        return {
          success: true,
          status: statusCode,
          message,
          data,
        };
      }),
    );
  }
}