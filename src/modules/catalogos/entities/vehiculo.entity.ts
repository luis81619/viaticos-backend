import {
  Column,
  Entity,
  Index,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';
import { VehiculoClase } from '../enums/vehiculo-clase.enum';

@Entity({
  name: 'vehiculo',
})

@Index('IDX_VEHICULO_PLACA', ['placa'])

export class Vehiculo extends BaseEntity {

  @Column({
    type: 'int',
  })
  tipo: VehiculoTipo;

  @Column({
    type: 'int',
  })
  clase: VehiculoClase;

  @Column({
    length: 100,
  })
  submarca: string;

  @Column({
    length: 100,
  })
  marca: string;

  @Column({
    type: 'int',
  })
  modelo: number;

  @Column({
    length: 50,
  })
  color: string;

  @Column({
    length: 20,
    unique: true,
  })
  placa: string;

  @Column({
    default: true,
  })
  status: boolean;
}
