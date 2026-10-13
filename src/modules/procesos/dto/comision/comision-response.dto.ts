import { VehiculoTipo } from '../../../catalogos/enums/vehiculo-tipo.enum';
import { ComisionEstado } from '../../enums/comision-estado.enum';

export class ComisionDestinoResponseDto {
  id: string;
  municipio: { id: string; nombre: string; estado: string | null } | null;
  nivelAplicacion: { id: string; nombre: string } | null;
  descripcion: string | null;
  fechaDesde: string;
  fechaHasta: string;
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  otros: number;
}

export class ComisionResponseDto {
  id: string;
  folio: string | null;
  estado: ComisionEstado;

  trabajador: {
    id: string;
    numeroTrabajador: number | null;
    nombreCompleto: string;
    rfc: string | null;
  } | null;

  direccion: { id: string; nombre: string; siglas: string | null } | null;
  actividad: { id: string; folio: string; descripcion: string } | null;
  nivelAplicacion: { id: string; nombre: string } | null;
  municipioOrigen: { id: string; nombre: string; estado: string | null } | null;
  tipoTransporte: VehiculoTipo | null;
  vehiculo: {
    id: string;
    marca: string;
    submarca: string;
    modelo: number;
    color: string;
    placa: string;
  } | null;

  objetivo: string;
  conceptoOtros: string | null;
  autoriza: string | null;
  puestoAutoriza: string | null;

  fechaElaboracion: string;
  fechaAutorizacion: string | null;

  destinos: ComisionDestinoResponseDto[];

  totalViaticos: number;

  revisiones: {
    id: string;
    estado: ComisionEstado;
    observaciones: string | null;
    usuario: string;
    fecha: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}
