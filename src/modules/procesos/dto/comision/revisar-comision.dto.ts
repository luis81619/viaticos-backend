import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ACCIONES_REVISION = ['autorizar', 'correccion', 'rechazar'] as const;

export type AccionRevision = (typeof ACCIONES_REVISION)[number];

export class RevisarComisionDto {
  @IsIn(ACCIONES_REVISION)
  accion: AccionRevision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
