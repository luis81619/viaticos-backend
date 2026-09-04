import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';
import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../../enums/vehiculo-clase.enum';

export class FindVehiculosQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  submarca?: string;

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
  @Type(() => Number)
  @IsEnum(VehiculoClase)
  clase?: VehiculoClase;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  modelo?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsIn(['submarca', 'marca', 'modelo', 'placa', 'tipo', 'clase', 'createdAt', 'updatedAt'])
  sortBy?: 'submarca' | 'marca' | 'modelo' | 'placa' | 'tipo' | 'clase' | 'createdAt' | 'updatedAt' = 'submarca';
}
