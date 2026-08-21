import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';
import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';

export class FindVehiculosQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(VehiculoTipo)
  tipo?: VehiculoTipo;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsIn(['nombre', 'marca', 'modelo', 'placa', 'tipo', 'createdAt', 'updatedAt'])
  sortBy?: 'nombre' | 'marca' | 'modelo' | 'placa' | 'tipo' | 'createdAt' | 'updatedAt' = 'nombre';
}
