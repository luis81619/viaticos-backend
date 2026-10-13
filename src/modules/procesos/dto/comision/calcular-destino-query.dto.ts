import { IsDateString, IsUUID } from 'class-validator';

export class CalcularDestinoQueryDto {
  @IsUUID()
  nivelAplicacionId: string;

  @IsUUID()
  municipioId: string;

  @IsDateString()
  fechaDesde: string;

  @IsDateString()
  fechaHasta: string;
}
