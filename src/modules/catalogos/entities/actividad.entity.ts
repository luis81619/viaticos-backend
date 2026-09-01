import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { TipoUnidad } from '../enums/tipo-unidad.enum';
import { ProyectoPoa } from './proyecto-poa.entity';

@Entity({ name: 'actividades' })
@Index(['folio'], { unique: true })
@Index(['proyectoPoaId'])
@Index(['tipo'])
@Check(`"tipo" BETWEEN 1 AND 9`)
export class Actividad extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 30,
    name: 'folio',
  })
  folio: string;

  @Column({
    type: 'text',
    name: 'descripcion',
  })
  descripcion: string;

  @Column({
    type: 'uuid',
    name: 'proyecto_poa_id',
  })
  proyectoPoaId: string;

  @ManyToOne(
    () => ProyectoPoa,
    {
      nullable: false,
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'proyecto_poa_id',
  })
  proyectoPoa: ProyectoPoa;

  @Column({
    type: 'text',
    name: 'medio_verificacion',
  })
  medioVerificacion: string;

  @Column({
    type: 'smallint',
    name: 'tipo',
  })
  tipo: TipoUnidad;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'ingreso',
  })
  ingreso: string;

  @Column({
    type: 'boolean',
    name: 'con_recurso',
    default: false,
  })
  conRecurso: boolean;
}