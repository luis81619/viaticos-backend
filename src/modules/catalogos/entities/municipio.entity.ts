import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { Estado } from './estado.entity';
import { Zona } from './zona.entity';

@Entity({
  name: 'municipio',
})
@Unique('UQ_MUNICIPIO_NOMBRE_ESTADO', ['nombre', 'estado'])
export class Municipio extends BaseEntity {

  @Column({
    length: 255,
  })
  nombre: string;

  @ManyToOne(
    () => Estado,
    { nullable: true },
  )
  @JoinColumn({
    name: 'estadoId',
  })
  estado: Estado;

  @ManyToOne(
    () => Zona,
    { nullable: true },
  )
  @JoinColumn({
    name: 'id_zona',
  })
  zona?: Zona;

  @Column({
    nullable: true,
    length: 150,
  })
  region?: string;
}
