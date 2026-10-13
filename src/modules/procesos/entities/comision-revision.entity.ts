import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { ComisionEstado } from '../enums/comision-estado.enum';
import { Comision } from './comision.entity';

// Historial de la comisión: cada fila es una acción (enviada, corrección, autorizada…)
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

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'varchar', length: 255 })
  usuarioNombre: string;
}
