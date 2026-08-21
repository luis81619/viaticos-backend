import { VehiculoTipo } from '../../enums/vehiculo-tipo.enum';

export class VehiculoResponseDto {
  id: string;

  tipo: VehiculoTipo;

  nombre: string;

  marca: string;

  modelo: string;

  color: string;

  placa: string;

  status: boolean;

  createdAt: Date;

  updatedAt: Date;
}
