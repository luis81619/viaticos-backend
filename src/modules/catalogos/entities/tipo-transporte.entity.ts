import {
  Column,
  Entity,
  Index,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({
  name: 'tipo_transporte',
})

@Index('IDX_TIPO_TRANSPORTE_NOMBRE', ['nombre'])

export class TipoTransporte extends BaseEntity {

  @Column({
    length: 150,
    unique: true,
  })
  nombre: string;

  @Column({
    nullable: true,
    length: 500,
  })
  descripcion?: string;

  @Column({
    default: true,
  })
  status: boolean;
}