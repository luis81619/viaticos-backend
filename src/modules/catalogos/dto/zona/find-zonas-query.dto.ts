import { IsOptional, IsUUID } from 'class-validator';

export class FindZonasQueryDto {
  @IsOptional()
  @IsUUID()
  estadoId?: string;
}
