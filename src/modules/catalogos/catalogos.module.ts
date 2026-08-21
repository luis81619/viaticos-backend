import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banco } from './entities/banco.entity';
import { Vehiculo } from './entities/vehiculo.entity';

import { BancosController } from './controllers/bancos.controller';
import { VehiculosController } from './controllers/vehiculos.controller';

import { BancosService } from './services/bancos.service';
import { VehiculosService } from './services/vehiculos.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Banco,
      Vehiculo,
    ]),
    AuthModule,
  ],
  controllers: [
    BancosController,
    VehiculosController,
  ],
  providers: [
    BancosService,
    VehiculosService,
  ],
})
export class CatalogosModule {}
