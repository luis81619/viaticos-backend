import { VehiculoTipo } from '../../../catalogos/enums/vehiculo-tipo.enum';
import { ComisionAccion } from '../../enums/comision-accion.enum';
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
  conViaticos: boolean;

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
    clase: number;
    marca: string;
    submarca: string;
    modelo: number;
    color: string;
    placa: string;
  } | null;

  objetivo: string | null;
  conceptoOtros: string | null;
  autoriza: string | null;
  puestoAutoriza: string | null;

  fechaElaboracion: string;
  fechaAutorizacion: string | null;

  destinos: ComisionDestinoResponseDto[];

  totalViaticos: number;

  // Sólo quien envió la comisión (o el comisionado) puede cancelarla, y mientras siga Por autorizar.
  puedeCancelar: boolean;

  // Borrador: quien lo capturó puede editarlo, enviarlo o eliminarlo; faltantes = lo que impide enviarlo.
  puedeEditar: boolean;
  faltantes: string[];

  revisiones: {
    id: string;
    estado: ComisionEstado;
    accion: ComisionAccion | null;
    observaciones: string | null;
    usuario: string;
    fecha: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}
