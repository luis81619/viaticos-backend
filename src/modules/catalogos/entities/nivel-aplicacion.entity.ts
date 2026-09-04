import { Column, Entity } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({
  name: 'nivel_aplicacion',
})
export class NivelAplicacion extends BaseEntity {
  @Column({
    length: 100,
    unique: true,
  })
  nombre: string;

  @Column({
    type: 'int',
    default: 0,
  })
  orden: number;
}
