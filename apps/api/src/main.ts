import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { resolveHttpsOptions } from './https-options';

async function bootstrap() {
  const httpsOptions = resolveHttpsOptions({
    tlsEnabled: process.env.TLS_ENABLED,
    tlsKeyPath: process.env.TLS_KEY_PATH,
    tlsCertPath: process.env.TLS_CERT_PATH,
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    ...(httpsOptions ? { httpsOptions } : {}),
  });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const cspDirectives: Record<string, unknown> = {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  };
  // Helmet fusiona defaults: borrar la clave kebab no basta; hay que pasar null en camelCase.
  if (!isProduction) {
    delete cspDirectives['upgrade-insecure-requests'];
    cspDirectives.upgradeInsecureRequests = null;
  }
  app.use(
    helmet({
      contentSecurityPolicy: {
        // null en upgradeInsecureRequests desactiva la directiva (Helmet 8)
        directives: cspDirectives as NonNullable<
          Parameters<typeof helmet.contentSecurityPolicy>[0]
        >['directives'],
      },
    }),
  );
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
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

  const swagger = new DocumentBuilder()
    .setTitle('MinimalEcommerce API')
    .setDescription('API REST marketplace — NestJS monolito modular (sin frontend)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('PORT') ?? 8080;
  const protocol = httpsOptions ? 'https' : 'http';
  await app.listen(port);
  logger.log(`API listening on :${port} (${protocol.toUpperCase()})`);
  logger.log(`Swagger UI: ${protocol}://localhost:${port}/docs`);
  if (!httpsOptions && !isProduction) {
    logger.warn(
      'Sin TLS local: Safari puede fallar con Swagger en HTTP. Ejecuta: pnpm certs:dev',
    );
  }
}
bootstrap();
