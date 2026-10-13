import { Column, Entity } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

@Entity({ name: 'archivo' })
export class Archivo extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  driveId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;
}
