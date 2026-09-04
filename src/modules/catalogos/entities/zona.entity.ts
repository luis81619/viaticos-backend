import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { Estado } from './estado.entity';

@Entity({
  name: 'zona',
})
export class Zona extends BaseEntity {

  @Column({
    length: 150,
  })
  nombre: string;

  @Column({
    length: 50,
  })
  zona: string;

  @Column({
    nullable: true,
    length: 500,
  })
  descripcion?: string;

  @ManyToOne(
    () => Estado,
    { nullable: false },
  )
  @JoinColumn({
    name: 'estado_id',
  })
  estado: Estado;
}
