import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { ComisionAccion } from '../../enums/comision-accion.enum';

export const ACCIONES_REVISION = [
  ComisionAccion.AUTORIZAR,
  ComisionAccion.CORRECCION,
  ComisionAccion.RECHAZAR,
] as const;

export type AccionRevision = (typeof ACCIONES_REVISION)[number];

export class RevisarComisionDto {
  @IsIn(ACCIONES_REVISION)
  accion: AccionRevision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
