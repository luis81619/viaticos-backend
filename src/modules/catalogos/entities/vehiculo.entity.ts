import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { TipoTransporte } from './tipo-transporte.entity';

@Entity({
  name: 'vehiculo',
})

@Index('IDX_VEHICULO_PLACAS', ['placas'])

export class Vehiculo extends BaseEntity {

  @ManyToOne(
    () => TipoTransporte,
    { nullable: false },
  )
  @JoinColumn({
    name: 'tipo_transporte_id',
  })
  tipoTransporte: TipoTransporte;

  @Column({
    length: 100,
  })
  marca: string;

  @Column({
    length: 100,
  })
  modelo: string;

  @Column({
    length: 20,
    unique: true,
  })
  placas: string;

  @Column({
    nullable: true,
    length: 50,
  })
  serie?: string;

  @Column({
    default: true,
  })
  status: boolean;
}