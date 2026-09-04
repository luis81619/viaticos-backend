import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';

export class FindMunicipiosQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsUUID()
  estadoId?: string;

  @IsOptional()
  @IsUUID()
  zonaId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsIn(['nombre', 'region', 'createdAt', 'updatedAt'])
  sortBy?: 'nombre' | 'region' | 'createdAt' | 'updatedAt' = 'nombre';
}
