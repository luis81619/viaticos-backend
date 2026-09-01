import {
  Check,
  Column,
  Entity,
  Index,
} from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'proyectos_poa' })
@Index(['numero'], { unique: true })
@Check(`"numero" > 0`)
export class ProyectoPoa extends BaseEntity {
  @Column({
    type: 'smallint',
    name: 'numero',
  })
  numero: number;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'nombre',
  })
  nombre: string;

  @Column({
    type: 'boolean',
    name: 'is_active',
    default: true,
  })
  isActive: boolean;
}