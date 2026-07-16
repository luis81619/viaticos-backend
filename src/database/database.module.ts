import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { SnakeNamingStrategy } from './strategies/snake-naming.strategy';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({

        type: 'postgres',

        host: configService.get<string>('DB_HOST'),

        port: Number(
          configService.get<number>('DB_PORT'),
        ),

        username:
          configService.get<string>('DB_USERNAME'),

        password:
          configService.get<string>('DB_PASSWORD'),

        database:
          configService.get<string>('DB_NAME'),

        autoLoadEntities: true,

        synchronize:
          configService.get<string>('DB_SYNCHRONIZE') === 'true',

        logging:
          configService.get<string>('DB_LOGGING') === 'true',

        namingStrategy:
          new SnakeNamingStrategy(),
      }),
    }),
  ],
})
export class DatabaseModule {}