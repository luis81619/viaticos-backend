import {
  BadRequestException,
  ValidationError,
} from '@nestjs/common';

import { ErrorCode } from './error-codes';

export function validationExceptionFactory(
  errors: ValidationError[],
) {

  const formattedErrors = errors.map((error) => ({
    field: error.property,
    issue: Object.values(error.constraints || {})[0],
  }));

  return new BadRequestException({
    success: false,
    status: 400,

    error: {
      code: ErrorCode.VALIDATION_FAILED,
      message: 'One or more fields are invalid.',
      details: formattedErrors,
    },
  });

}