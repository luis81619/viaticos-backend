import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';
import { Actividad } from '../../catalogos/entities/actividad.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { NivelAplicacion } from '../../catalogos/entities/nivel-aplicacion.entity';
import { Plantel } from '../../catalogos/entities/plantel.entity';
import { Trabajador } from '../../catalogos/entities/trabajador.entity';
import { Vehiculo } from '../../catalogos/entities/vehiculo.entity';
import { VehiculoTipo } from '../../catalogos/enums/vehiculo-tipo.enum';

import { ComisionEstado } from '../enums/comision-estado.enum';
import { Archivo } from './archivo.entity';
import { ComisionDestino } from './comision-destino.entity';
import { ComisionRevision } from './comision-revision.entity';

// Dirección, actividad, nivel, origen y objetivo pueden faltar sólo mientras la comisión es Borrador;
// para enviarla se exigen (ver faltantesParaEnviar en el servicio).
@Entity({ name: 'comision' })
@Index(['trabajadorId'])
@Index(['direccionId'])
@Index(['estado'])
export class Comision extends BaseEntity {
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  folio: string | null;

  @Column({ type: 'smallint', default: ComisionEstado.POR_AUTORIZAR })
  estado: ComisionEstado;

  // Sin viáticos: la comisión se registra y autoriza igual, pero sus destinos no llevan montos.
  @Column({ type: 'boolean', default: true })
  conViaticos: boolean;

  @Column({ type: 'uuid', name: 'trabajador_id' })
  trabajadorId: string;

  @ManyToOne(() => Trabajador, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador: Trabajador;

  @Column({ type: 'uuid', name: 'direccion_id', nullable: true })
  direccionId: string | null;

  @ManyToOne(() => Plantel, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'direccion_id' })
  direccion: Plantel | null;

  @Column({ type: 'uuid', name: 'actividad_id', nullable: true })
  actividadId: string | null;

  @ManyToOne(() => Actividad, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Actividad | null;

  @Column({ type: 'uuid', name: 'nivel_aplicacion_id', nullable: true })
  nivelAplicacionId: string | null;

  @ManyToOne(() => NivelAplicacion, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nivel_aplicacion_id' })
  nivelAplicacion: NivelAplicacion | null;

  @Column({ type: 'uuid', name: 'municipio_origen_id', nullable: true })
  
  municipioOrigenId: string | null;

  @ManyToOne(() => Municipio, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipio_origen_id' })
  municipioOrigen: Municipio | null;

  @Column({ type: 'smallint', nullable: true })
  tipoTransporte: VehiculoTipo | null;

  @Column({ type: 'uuid', name: 'vehiculo_id', nullable: true })
  vehiculoId: string | null;

  @ManyToOne(() => Vehiculo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo | null;

  @Column({ type: 'uuid', name: 'archivo_id', nullable: true })
  archivoId: string | null;

  @ManyToOne(() => Archivo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'archivo_id' })
  archivo: Archivo | null;

  @Column({ type: 'text', nullable: true })
  objetivo: string | null;

  @Column({ type: 'text', nullable: true })
  conceptoOtros: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  autoriza: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  puestoAutoriza: string | null;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaElaboracion: string;

  @Column({ type: 'date', nullable: true })
  fechaAutorizacion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comprobante: string | null;

  @OneToMany(() => ComisionDestino, (destino) => destino.comision, {
    cascade: ['insert'],
  })
  destinos: ComisionDestino[];

  @OneToMany(() => ComisionRevision, (revision) => revision.comision, {
    cascade: ['insert'],
  })
  revisiones: ComisionRevision[];
}
