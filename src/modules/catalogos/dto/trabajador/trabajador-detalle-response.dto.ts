import { TrabajadorResponseDto } from './trabajador-response.dto';

export class TrabajadorDetalleResponseDto extends TrabajadorResponseDto {
  banco: { id: string; nombre: string } | null;
}
