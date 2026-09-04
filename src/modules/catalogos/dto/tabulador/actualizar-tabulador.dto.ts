import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class TarifaUpdateItemDto {
  @IsUUID()
  nivelAplicacionId: string;

  @IsIn(['I', 'II', 'III', 'IV'])
  zona: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaHospedaje: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaAlimentos: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaPeaje?: number;
}

export class ActualizarTabuladorDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TarifaUpdateItemDto)
  tarifas: TarifaUpdateItemDto[];
}
