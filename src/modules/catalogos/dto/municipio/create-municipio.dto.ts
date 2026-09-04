import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { normalizeToUpperCase } from 'src/common/utils/string-normalizer.util';

export class CreateMunicipioDto {
  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @IsUUID()
  estadoId: string;

  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @MaxLength(150)
  region?: string;
}
