import { IsIn, IsOptional, IsString } from 'class-validator';

import { BasePaginationQueryDto } from 'src/common/dto/base-pagination-query.dto';

export class FindTrabajadoresQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  numeroTrabajador?: string;

  @IsOptional()
  @IsIn(['nombre', 'apellidoPaterno', 'apellidoMaterno', 'numeroTrabajador', 'rfc'])
  sortBy?:
    | 'nombre'
    | 'apellidoPaterno'
    | 'apellidoMaterno'
    | 'numeroTrabajador'
    | 'rfc' = 'apellidoPaterno';
}
