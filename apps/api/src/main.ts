import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configurarApp } from './compartido/config/configurar-app';
import { resolveHttpsOptions } from './https-options';

async function bootstrap() {
  const httpsOptions = resolveHttpsOptions({
    tlsEnabled: process.env.TLS_ENABLED,
    tlsKeyPath: process.env.TLS_KEY_PATH,
    tlsCertPath: process.env.TLS_CERT_PATH,
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
    ...(httpsOptions ? { httpsOptions } : {}),
  });

  configurarApp(app);
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const port = Number(config.get('PORT') ?? 8080);
  const protocol = httpsOptions ? 'https' : 'http';
  await app.listen(port);
  logger.log(`API MinimalShop en :${port} (${protocol.toUpperCase()})`);
  if (config.get<boolean>('SWAGGER_ENABLED')) {
    logger.log(`Swagger UI: ${protocol}://localhost:${port}/docs`);
  }
  if (!httpsOptions && !isProduction) {
    logger.warn(
      'Sin TLS local: Safari puede fallar con Swagger en HTTP. Ejecuta: pnpm certs:dev',
    );
  }
}

bootstrap();
