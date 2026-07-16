import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';

import { Banco } from '../modules/catalogos/entities/banco.entity';
import { TipoTransporte } from '../modules/catalogos/entities/tipo-transporte.entity';
import { Vehiculo } from '../modules/catalogos/entities/vehiculo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Banco,
      TipoTransporte,
      Vehiculo,
    ]),
  ],

  controllers: [
    CatalogosController,
  ],

  providers: [
    CatalogosService,
  ],

  exports: [
    CatalogosService,
  ],
})
export class CatalogosModule {}
