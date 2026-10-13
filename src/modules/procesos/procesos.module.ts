import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';

import { Archivo } from './entities/archivo.entity';
import { Comision } from './entities/comision.entity';
import { ComisionDestino } from './entities/comision-destino.entity';
import { ComisionRevision } from './entities/comision-revision.entity';

import { ComisionesController } from './controllers/comisiones.controller';
import { ComisionesService } from './services/comisiones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comision,
      ComisionDestino,
      ComisionRevision,
      Archivo,
    ]),
    AuthModule,
  ],
  controllers: [ComisionesController],
  providers: [ComisionesService],
})
export class ProcesosModule {}
