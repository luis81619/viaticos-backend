export enum ComisionEstado {
  POR_AUTORIZAR = 1,
  CORRECCION = 2,
  AUTORIZADA = 3,
  PENDIENTE_COMPROBAR = 4,
  PROCESO_COMPROBACION = 5,
  TERMINADA = 6,
  CANCELADA = 7,
  FUERA_DE_TIEMPO = 8,
  COMPROBAR_FUERA_DE_TIEMPO = 9,
  // Capturada pero aún no enviada; sólo la ven quien la capturó y el comisionado.
  BORRADOR = 10,
}
