import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { ProcesosModule } from './modules/procesos/procesos.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CatalogosModule,
    ProcesosModule,
    AuthModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
