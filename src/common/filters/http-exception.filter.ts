import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { QueryFailedError } from 'typeorm';

import { ErrorCode } from '../exceptions/error-codes';

interface ErrorResponse {
  code: ErrorCode | string;
  message: string;
  details: unknown[];
}

interface HttpExceptionResponse {
  statusCode?: number;
  code?: ErrorCode | string;
  message?: string | string[];
  details?: unknown[];

  error?: {
    code?: ErrorCode | string;
    message?: string;
    details?: unknown[];
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    let error: ErrorResponse = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      details: [],
    };

    /*
    |--------------------------------------------------------------------------
    | HTTP EXCEPTIONS
    |--------------------------------------------------------------------------
    */

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse =
        exception.getResponse();

      error = this.mapHttpException(
        status,
        exceptionResponse,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE ERRORS
    |--------------------------------------------------------------------------
    */

    else if (
      exception instanceof QueryFailedError
    ) {
      status = HttpStatus.BAD_REQUEST;

      error = this.mapDatabaseError(exception);
    }

    /*
    |--------------------------------------------------------------------------
    | UNKNOWN ERRORS
    |--------------------------------------------------------------------------
    */

    else if (exception instanceof Error) {
      error = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message:
          'An unexpected internal error occurred.',
        details:
          process.env.NODE_ENV === 'development'
            ? [exception.message]
            : [],
      };
    }

    response.status(status).json({
      success: false,
      status,
      error,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    });
  }

  private mapHttpException(
    status: number,
    exceptionResponse: string | object,
  ): ErrorResponse {
    const defaultCode =
      this.getErrorCodeByStatus(status);

    if (typeof exceptionResponse === 'string') {
      return {
        code: defaultCode,
        message: exceptionResponse,
        details: [],
      };
    }

    const responseObject =
      exceptionResponse as HttpExceptionResponse;

    /*
    |--------------------------------------------------------------------------
    | CUSTOM ERROR ENVELOPE
    |--------------------------------------------------------------------------
    |
    | Ejemplo:
    |
    | throw new ForbiddenException({
    |   error: {
    |     code: ErrorCode.INSUFFICIENT_PERMISSIONS,
    |     message: '...',
    |     details: [],
    |   },
    | });
    |
    */

    if (
      responseObject.error &&
      typeof responseObject.error === 'object'
    ) {
      return {
        code:
          responseObject.error.code ??
          defaultCode,

        message:
          responseObject.error.message ??
          'Request failed.',

        details:
          responseObject.error.details ?? [],
      };
    }

    /*
    |--------------------------------------------------------------------------
    | DIRECT CUSTOM EXCEPTION
    |--------------------------------------------------------------------------
    |
    | Ejemplo:
    |
    | throw new ForbiddenException({
    |   code: ErrorCode.INSUFFICIENT_PERMISSIONS,
    |   message: '...',
    |   details: [],
    | });
    |
    */

    if (responseObject.code) {
      return {
        code: responseObject.code,

        message: Array.isArray(
          responseObject.message,
        )
          ? responseObject.message[0]
          : responseObject.message ??
            'Request failed.',

        details:
          responseObject.details ??
          (Array.isArray(responseObject.message)
            ? responseObject.message
            : []),
      };
    }

    /*
    |--------------------------------------------------------------------------
    | STANDARD NEST EXCEPTION
    |--------------------------------------------------------------------------
    */

    const rawMessage = responseObject.message;

    if (Array.isArray(rawMessage)) {
      return {
        code: defaultCode,
        message: rawMessage[0] ?? 'Request failed.',
        details: rawMessage,
      };
    }

    return {
      code: defaultCode,
      message: rawMessage ?? 'Request failed.',
      details: [],
    };
  }

  private mapDatabaseError(
    exception: QueryFailedError,
  ): ErrorResponse {
    const driverError = exception.driverError as {
      code?: string;
      constraint?: string;
      detail?: string;
    };

    if (driverError.code === '23505') {
      let message =
        'The resource already exists.';

      if (
        driverError.constraint ===
        'UQ_BANCO_NOMBRE'
      ) {
        message =
          'Existe un banco con el mismo nombre';
      }

      return {
        code: ErrorCode.DUPLICATE_RESOURCE,
        message,
        details: [],
      };
    }

    return {
      code: ErrorCode.DATABASE_ERROR,
      message:
        'A database error occurred.',
      details:
        process.env.NODE_ENV === 'development'
          ? [
              driverError.detail ??
                exception.message,
            ]
          : [],
    };
  }

  private getErrorCodeByStatus(
    status: number,
  ): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;

      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;

      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;

      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;

      case HttpStatus.CONFLICT:
        return ErrorCode.DUPLICATE_RESOURCE;

      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;

      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}