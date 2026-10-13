import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../../enums/vehiculo-clase.enum';

export class VehiculoResponseDto {
  id: string;

  tipo: VehiculoTipo;

  clase: VehiculoClase;

  submarca: string;

  marca: string;

  modelo: number;

  color: string;

  placa: string;

  kmInicial: number | null;

  kmFinal: number | null;

  status: boolean;

  createdAt: Date;

  updatedAt: Date;
}
