import { TipoUnidad } from '../../enums/tipo-unidad.enum';

export class ProyectoPoaActividadResponseDto {
  id: string;
  numero: number;
  nombre: string;
  isActive: boolean;
}

export class ActividadResponseDto {
  id: string;
  folio: string;
  descripcion: string;
  proyectoPoaId: string;
  medioVerificacion: string;
  tipo: TipoUnidad;
  ingreso: string;
  conRecurso: boolean;
  proyectoPoa: ProyectoPoaActividadResponseDto;
}