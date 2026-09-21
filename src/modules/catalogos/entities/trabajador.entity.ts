import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// La tabla trabajador en viáticos es un espejo del maestro de RH.
// El id es el mismo UUID que en RH (no autogenerado) para poder hacer upsert.
@Entity({ name: 'trabajador' })
export class Trabajador {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre: string | null;

  @Column({ name: 'apellido_paterno', type: 'varchar', length: 255, nullable: true })
  apellidoPaterno: string | null;

  @Column({ name: 'apellido_materno', type: 'varchar', length: 255, nullable: true })
  apellidoMaterno: string | null;

  @Column({ name: 'email_personal', type: 'varchar', length: 255, nullable: true })
  emailPersonal: string | null;

  @Column({ name: 'email_institucional', type: 'varchar', length: 255, nullable: true })
  @Index({ unique: false })
  emailInstitucional: string | null;

  @Column({ name: 'numero_cuenta_nomina', type: 'varchar', length: 255, nullable: true })
  numeroCuentaNomina: string | null;

  @Column({ name: 'numero_seguridad_social', type: 'varchar', length: 255, nullable: true })
  numeroSeguridadSocial: string | null;

  @Column({ name: 'numero_trabajador', type: 'int', nullable: true })
  numeroTrabajador: number | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  rfc: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  celular: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telefono: string | null;

  @Column({ name: 'otro_telefono', type: 'varchar', length: 255, nullable: true })
  otroTelefono: string | null;

  // FK plana (sin @ManyToOne) — apunta al id del banco en Viáticos.
  @Column({ name: 'banco_id', type: 'uuid', nullable: true })
  bancoId: string | null;

  // Audit fields (los que vienen de RH — se guardan tal cual)
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date | null;
}
