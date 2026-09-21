import { Column, Entity } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({ name: 'zona' })
export class Zona extends BaseEntity {
  @Column({
    length: 150,
  })
  nombre: string;

  @Column({
    length: 50,
  })
  zona: string;
}
