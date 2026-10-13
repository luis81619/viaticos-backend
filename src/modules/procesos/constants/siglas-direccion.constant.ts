import { TipoUnidad } from '../../catalogos/enums/tipo-unidad.enum';

export const SIGLAS_POR_DIRECCION: Partial<Record<TipoUnidad, string>> = {
  [TipoUnidad.DIRECCION_GENERAL]: 'DG',
  [TipoUnidad.DIRECCION_ACADEMICA]: 'AC',
  [TipoUnidad.DIRECCION_PLANEACION]: 'PL',
  [TipoUnidad.DIRECCION_VINCULACION]: 'VC',
  [TipoUnidad.DIRECCION_INFORMATICA]: 'IF',
  [TipoUnidad.DIRECCION_ADMINISTRACION]: 'AD',
};
