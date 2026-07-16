import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression = require('compression');
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { validationExceptionFactory } from './common/exceptions/validation-exception.factory';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* GLOBAL PREFIX */
  app.setGlobalPrefix('viaticos');

  /* API VERSIONING */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /* GLOBAL VALIDATION PIPE */
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  }));

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new TransformResponseInterceptor(
      app.get(Reflector),
    ),
  );

  /* SECURITY HEADERS */
  app.use(helmet());

  /* RESPONSE COMPRESSION */
  app.use(compression());


  /* CORS */
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4203',
      'https://global.cecytem.net',
    ],
    credentials: true,
  });

  /*  SERVER START */
  await app.listen(3003);

  console.log(
    `VIATICOS API running on: ${await app.getUrl()}`,
  );
}
bootstrap();
