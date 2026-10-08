import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { CABECERA_CORRELACION, middlewareCorrelacion } from '../observabilidad/correlacion';

export function configurarApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(middlewareCorrelacion);

  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const cspDirectives: Record<string, unknown> = {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  };
  if (!isProduction) {
    delete cspDirectives['upgrade-insecure-requests'];
    cspDirectives.upgradeInsecureRequests = null;
  }
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: cspDirectives as NonNullable<Parameters<typeof helmet.contentSecurityPolicy>[0]>['directives'],
      },
    }),
  );

  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
    exposedHeaders: [CABECERA_CORRELACION],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get<boolean>('SWAGGER_ENABLED')) {
    const doc = new DocumentBuilder()
      .setTitle('MinimalShop API')
      .setDescription('API REST del marketplace MinimalShop (NestJS monolito modular)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));
    logger.log('Swagger UI en /docs');
  }
}
