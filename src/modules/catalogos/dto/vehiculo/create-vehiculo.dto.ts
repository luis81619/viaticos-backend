import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { normalizeToUpperCase } from 'src/common/utils/string-normalizer.util';
import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../../enums/vehiculo-clase.enum';

export class CreateVehiculoDto {
  @Type(() => Number)
  @IsEnum(VehiculoTipo)
  tipo: VehiculoTipo;

  @Type(() => Number)
  @IsEnum(VehiculoClase)
  clase: VehiculoClase;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  submarca: string;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  marca: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  modelo: number;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  color: string;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  placa: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
