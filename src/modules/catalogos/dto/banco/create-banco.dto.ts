import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { normalizeToUpperCase } from 'src/common/utils/string-normalizer.util';

export class CreateBancoDto {
  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}