import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { normalizeToUpperCase } from 'src/common/utils/string-normalizer.util';
import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';

export class CreateVehiculoDto {
  @Type(() => Number)
  @IsEnum(VehiculoTipo)
  tipo: VehiculoTipo;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  marca: string;

  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelo: string;

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
