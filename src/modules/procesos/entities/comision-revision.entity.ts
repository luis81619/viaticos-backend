import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { ComisionAccion } from '../enums/comision-accion.enum';
import { ComisionEstado } from '../enums/comision-estado.enum';
import { Comision } from './comision.entity';

// Historial de la comisión: cada fila es una acción (por autorizar, corrección, autorizada…)
// con quién la hizo (created_by / usuario_nombre) y cuándo (created_at).
@Entity({ name: 'comision_revision' })
@Index(['comisionId'])
export class ComisionRevision extends BaseEntity {
  @Column({ type: 'uuid', name: 'comision_id' })
  comisionId: string;

  @ManyToOne(() => Comision, (comision) => comision.revisiones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comision_id' })
  comision: Comision;

  @Column({ type: 'smallint' })
  estado: ComisionEstado;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accion: ComisionAccion | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'varchar', length: 255 })
  usuarioNombre: string;
}
