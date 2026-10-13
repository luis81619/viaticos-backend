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

@Entity({ name: 'comision' })
@Index(['trabajadorId'])
@Index(['direccionId'])
@Index(['estado'])
export class Comision extends BaseEntity {
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  folio: string | null;

  @Column({ type: 'smallint', default: ComisionEstado.ENVIADA })
  estado: ComisionEstado;

  @Column({ type: 'uuid', name: 'trabajador_id' })
  trabajadorId: string;

  @ManyToOne(() => Trabajador, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador: Trabajador;

  @Column({ type: 'uuid', name: 'direccion_id' })
  direccionId: string;

  @ManyToOne(() => Plantel, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'direccion_id' })
  direccion: Plantel;

  @Column({ type: 'uuid', name: 'actividad_id' })
  actividadId: string;

  @ManyToOne(() => Actividad, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Actividad;

  @Column({ type: 'uuid', name: 'nivel_aplicacion_id' })
  nivelAplicacionId: string;

  @ManyToOne(() => NivelAplicacion, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nivel_aplicacion_id' })
  nivelAplicacion: NivelAplicacion;

  @Column({ type: 'uuid', name: 'municipio_origen_id' })
  municipioOrigenId: string;

  @ManyToOne(() => Municipio, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipio_origen_id' })
  municipioOrigen: Municipio;

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

  @Column({ type: 'text' })
  objetivo: string;

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
