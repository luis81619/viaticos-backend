import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { VehiculoTipo } from '../../../catalogos/enums/vehiculo-tipo.enum';

export const TIPOS_TRANSPORTE = [
  VehiculoTipo.OFICIAL,
  VehiculoTipo.PARTICULAR,
  VehiculoTipo.AUTOBUS,
  VehiculoTipo.OTRO,
];

export class CreateComisionDestinoDto {
  @IsUUID()
  municipioId: string;

  @IsUUID()
  nivelAplicacionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsDateString()
  fechaDesde: string;

  @IsDateString()
  fechaHasta: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otros?: number;
}

export class CreateComisionDto {
  @IsUUID()
  trabajadorId: string;

  // Si no viene, la comisión es con viáticos.
  @IsOptional()
  @IsBoolean()
  conViaticos?: boolean;

  @IsUUID()
  direccionId: string;

  @IsUUID()
  actividadId: string;

  @IsOptional()
  @IsUUID()
  nivelAplicacionId?: string;

  @IsUUID()
  municipioOrigenId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  objetivo: string;

  @IsIn(TIPOS_TRANSPORTE)
  tipoTransporte: VehiculoTipo;

  @IsOptional()
  @IsUUID()
  vehiculoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  autoriza?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  puestoAutoriza?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  conceptoOtros?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateComisionDestinoDto)
  destinos: CreateComisionDestinoDto[];
}
