import { OmitType, PartialType } from '@nestjs/mapped-types';

import { CreateComisionDto } from './create-comision.dto';

export class UpdateComisionDto extends PartialType(
  OmitType(CreateComisionDto, ['trabajadorId'] as const),
) {}
