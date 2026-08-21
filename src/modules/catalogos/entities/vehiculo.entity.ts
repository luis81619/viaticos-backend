import {
  Column,
  Entity,
  Index,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { VehiculoTipo } from '../enums/vehiculo-tipo.enum';

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
    length: 100,
  })
  nombre: string;

  @Column({
    length: 100,
  })
  marca: string;

  @Column({
    length: 100,
  })
  modelo: string;

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
