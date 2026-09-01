import {
  Check,
  Column,
  Entity,
} from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { TipoUnidad } from '../enums/tipo-unidad.enum';

@Entity({ name: 'planteles' })
@Check(`"tipo" BETWEEN 1 AND 9`)
export class Plantel extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
    name: 'nombre',
    unique: true,
  })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'cct',
    unique: true,
  })
  cct: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'clave',
    unique: true,
  })
  clave: string;

  @Column({
    type: 'varchar',
    length: 10,
    name: 'modelo',
  })
  modelo: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'director',
    nullable: true,
  })
  director?: string | null;

  @Column({
    type: 'smallint',
    name: 'tipo',
  })
  tipo: TipoUnidad;
}