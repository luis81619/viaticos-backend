import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banco } from './entities/banco.entity';
import { Vehiculo } from './entities/vehiculo.entity';

import { BancosController } from './controllers/bancos.controller';
import { VehiculosController } from './controllers/vehiculos.controller';

import { BancosService } from './services/bancos.service';
import { VehiculosService } from './services/vehiculos.service';

import { AuthModule } from '../auth/auth.module';
import { Plantel } from './entities/plantel.entity';
import { PlantelesController } from './controllers/planteles.controller';
import { PlantelesService } from './services/planteles.service';
import { HttpModule } from '@nestjs/axios';
import { ProyectoPoa } from './entities/proyecto-poa.entity';
import { Actividad } from './entities/actividad.entity';
import { ActividadesService } from './services/actividades.service';
import { ActividadesController } from './controllers/actividades.controller';

@Module({
  imports: [
    HttpModule,
    
    TypeOrmModule.forFeature([
      Banco,
      Vehiculo,
      Plantel,
      ProyectoPoa,
      Actividad
    ]),
    AuthModule,
  ],
  controllers: [
    BancosController,
    VehiculosController,
    PlantelesController,
    ActividadesController
  ],
  providers: [
    BancosService,
    VehiculosService,
    PlantelesService,
    ActividadesService,
  ],
})
export class CatalogosModule {}
