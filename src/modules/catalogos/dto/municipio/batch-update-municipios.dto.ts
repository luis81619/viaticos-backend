import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { normalizeToUpperCase } from 'src/common/utils/string-normalizer.util';

// Cambios que se aplicarán a todos los municipios seleccionados
export class BatchUpdateMunicipiosChangesDto {
  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeToUpperCase(value))
  @IsString()
  @MaxLength(150)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcionZona?: string;
}

export class BatchUpdateMunicipiosDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  ids: string[];

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BatchUpdateMunicipiosChangesDto)
  changes: BatchUpdateMunicipiosChangesDto;
}
