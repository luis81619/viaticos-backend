import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banco } from './entities/banco.entity';
import { Vehiculo } from './entities/vehiculo.entity';
import { Estado } from './entities/estado.entity';
import { Municipio } from './entities/municipio.entity';
import { Zona } from './entities/zona.entity';
import { NivelAplicacion } from './entities/nivel-aplicacion.entity';
import { TarifaViaticos } from './entities/tarifa-viaticos.entity';

import { BancosController } from './controllers/bancos.controller';
import { VehiculosController } from './controllers/vehiculos.controller';
import { MunicipiosController } from './controllers/municipios.controller';
import { EstadosController } from './controllers/estados.controller';
import { ZonasController } from './controllers/zonas.controller';
import { ZonificacionController } from './controllers/zonificacion.controller';
import { NivelesAplicacionController } from './controllers/niveles-aplicacion.controller';
import { TabuladorController } from './controllers/tabulador.controller';

import { BancosService } from './services/bancos.service';
import { VehiculosService } from './services/vehiculos.service';
import { MunicipiosService } from './services/municipios.service';
import { EstadosService } from './services/estados.service';
import { ZonasService } from './services/zonas.service';
import { ZonificacionService } from './services/zonificacion.service';
import { NivelesAplicacionService } from './services/niveles-aplicacion.service';
import { TabuladorService } from './services/tabulador.service';

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
      Actividad,
      Estado,
      Municipio,
      Zona,
      NivelAplicacion,
      TarifaViaticos,
    ]),
    AuthModule,
  ],
  controllers: [
    BancosController,
    VehiculosController,
    PlantelesController,
    ActividadesController,
    MunicipiosController,
    EstadosController,
    ZonasController,
    ZonificacionController,
    NivelesAplicacionController,
    TabuladorController,
  ],
  providers: [
    BancosService,
    VehiculosService,
    PlantelesService,
    ActividadesService,
    MunicipiosService,
    EstadosService,
    ZonasService,
    ZonificacionService,
    NivelesAplicacionService,
    TabuladorService,
  ],
})
export class CatalogosModule {}
