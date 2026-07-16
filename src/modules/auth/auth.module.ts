import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { GlobalAuthService } from './services/global-auth.service';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './controllers/auth.controller';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,

    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        timeout: Number(
          configService.get<string>(
            'GLOBAL_AUTH_TIMEOUT',
            '5000',
          ),
        ),
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [
    AuthController,
  ],
  providers: [GlobalAuthService, AuthService, JwtAuthGuard, RolesGuard],
  exports: [GlobalAuthService, AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}