import {IsBoolean, IsIn, IsOptional, IsString,} from 'class-validator';

import { Transform } from 'class-transformer';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';

export class FindBancosQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['nombre', 'createdAt', 'updatedAt'])
  sortBy?: 'nombre' | 'createdAt' | 'updatedAt' = 'nombre';
}