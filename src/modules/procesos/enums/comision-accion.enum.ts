import { ComisionEstado } from './comision-estado.enum';

// Qué se hizo en cada movimiento del historial. Rechazar (director) y cancelar (quien la envió)
// dejan la comisión Cancelada; la acción es lo que permite distinguirlas.
export enum ComisionAccion {
  BORRADOR = 'borrador',
  ENVIAR = 'enviar',
  // Corregida tras una devolución y enviada otra vez al director.
  REENVIAR = 'reenviar',
  AUTORIZAR = 'autorizar',
  CORRECCION = 'correccion',
  RECHAZAR = 'rechazar',
  CANCELAR = 'cancelar',
}

// Movimientos guardados antes de existir la columna `accion`: se deduce por el estado.
export const ACCION_POR_ESTADO_ANTERIOR: Partial<Record<ComisionEstado, ComisionAccion>> = {
  [ComisionEstado.POR_AUTORIZAR]: ComisionAccion.ENVIAR,
  [ComisionEstado.CORRECCION]: ComisionAccion.CORRECCION,
  [ComisionEstado.AUTORIZADA]: ComisionAccion.AUTORIZAR,
  [ComisionEstado.CANCELADA]: ComisionAccion.RECHAZAR,
};
