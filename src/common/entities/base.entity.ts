import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {

  /*
  |--------------------------------------------------------------------------
  | PRIMARY KEY
  |--------------------------------------------------------------------------
  */

  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*
  |--------------------------------------------------------------------------
  | AUDIT FIELDS
  |--------------------------------------------------------------------------
  */

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt?: Date | null;

  /*
  |--------------------------------------------------------------------------
  | AUDIT USERS
  |--------------------------------------------------------------------------
  */

  @Column({
    type: 'uuid',
    nullable: true,
  })
  createdBy?: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  updatedBy?: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  deletedBy?: string | null;
}