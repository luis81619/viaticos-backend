import {
  Column,
  Entity,
  Index,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({
  name: 'banco',
})

export class Banco extends BaseEntity {

  @Column({length: 150})
  @Index('UQ_BANCO_NOMBRE', { unique: true })
  nombre: string;

  @Column({
    default: true,
  })
  isActive: boolean;

}