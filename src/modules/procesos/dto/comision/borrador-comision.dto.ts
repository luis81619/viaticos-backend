import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/mapped-types';

import { CreateComisionDto } from './create-comision.dto';

// Borrador: sólo el trabajador es obligatorio; lo demás se guarda tal como se haya capturado.
// Al guardar se reemplaza todo el borrador (lo que no venga queda vacío).
export class BorradorComisionDto extends IntersectionType(
  PickType(CreateComisionDto, ['trabajadorId'] as const),
  PartialType(OmitType(CreateComisionDto, ['trabajadorId'] as const)),
) {}
