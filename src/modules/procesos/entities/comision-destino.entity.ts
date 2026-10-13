import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { NivelAplicacion } from '../../catalogos/entities/nivel-aplicacion.entity';

import { Comision } from './comision.entity';

@Entity({ name: 'comision_destino' })
@Index(['comisionId'])
export class ComisionDestino extends BaseEntity {
  @Column({ type: 'uuid', name: 'comision_id' })
  comisionId: string;

  @ManyToOne(() => Comision, (comision) => comision.destinos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comision_id' })
  comision: Comision;

  @Column({ type: 'uuid', name: 'municipio_id' })
  municipioId: string;

  @ManyToOne(() => Municipio, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipio_id' })
  municipio: Municipio;

  @Column({ type: 'uuid', name: 'nivel_aplicacion_id' })
  nivelAplicacionId: string;

  @ManyToOne(() => NivelAplicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nivel_aplicacion_id' })
  nivelAplicacion: NivelAplicacion;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'date' })
  fechaDesde: string;

  @Column({ type: 'date' })
  fechaHasta: string;

  @Column({ type: 'int' })
  diasComision: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  hospedaje: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  alimentos: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  peaje: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otros: number;
}
