import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';

import { NivelAplicacion } from './nivel-aplicacion.entity';

@Entity({
  name: 'tarifa_viaticos',
})
@Index('IDX_TARIFA_NIVEL_ZONA_VIGENCIA', [
  'nivelAplicacion',
  'zona',
  'vigenciaDesde',
])
export class TarifaViaticos extends BaseEntity {
  @ManyToOne(() => NivelAplicacion, { nullable: false })
  @JoinColumn({
    name: 'nivel_aplicacion_id',
  })
  nivelAplicacion: NivelAplicacion;

  //  número de zona
  @Column({
    length: 10,
  })
  zona: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  tarifaHospedaje: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  tarifaAlimentos: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  tarifaPeaje?: number;

  @Column({
    type: 'date',
  })
  vigenciaDesde: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  vigenciaHasta?: string;
}
