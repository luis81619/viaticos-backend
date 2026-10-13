import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';

import { ComisionEstado } from '../../enums/comision-estado.enum';

export class FindComisionesQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  folio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(ComisionEstado)
  estado?: ComisionEstado;

  @IsOptional()
  @IsUUID()
  direccionId?: string;

  @IsOptional()
  @IsString()
  trabajador?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
