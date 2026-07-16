import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Banco } from './entities/banco.entity';
import { BancosController } from './controllers/bancos.controller';
import { BancosService } from './services/bancos.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Banco,
    ]),
    AuthModule
  ],
  controllers: [
    BancosController,
  ],
  providers: [
    BancosService,
  ],
})
export class CatalogosModule {}