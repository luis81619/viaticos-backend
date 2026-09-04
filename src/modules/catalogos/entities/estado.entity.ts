import {
  Column,
  Entity,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({
  name: 'estado',
})
export class Estado extends BaseEntity {

  @Column({
    length: 255,
  })
  nombre: string;

  @Column({
    type: 'int',
  })
  clave: number;
}
