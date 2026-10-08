import { createKeyv } from '@keyv/redis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { ClsModule } from 'nestjs-cls';
import { randomUUID } from 'crypto';
import { AuthCompartidoModule } from './compartido/auth/auth-compartido.module';
import { JwtAuthGuard, RolesGuard } from './compartido/auth/guards';
import { validarEntorno } from './compartido/config/entorno';
import { EventosModule } from './compartido/eventos/eventos.module';
import { FiltroExcepciones } from './compartido/errores/filtro-excepciones';
import { MediaModule } from './compartido/media/media.module';
import { CABECERA_CORRELACION } from './compartido/observabilidad/correlacion';
import { PrismaModule } from './compartido/prisma/prisma.module';
import { PrismaService } from './compartido/prisma/prisma.service';
import { CLIENTE_REDIS, RedisModule } from './compartido/redis/redis.module';
import { SaludModule } from './compartido/salud/salud.module';
import { CarritoModule } from './modulos/carrito/carrito.module';
import { CatalogoModule } from './modulos/catalogo/catalogo.module';
import { ComplementariosModule } from './modulos/complementarios/complementarios.module';
import { InventarioModule } from './modulos/inventario/inventario.module';
import { NotificacionesModule } from './modulos/notificaciones/notificaciones.module';
import { PagosModule } from './modulos/pagos/pagos.module';
import { PedidosModule } from './modulos/pedidos/pedidos.module';
import { RegistroModulosModule } from './modulos/registro-modulos/registro-modulos.module';
import { ReportesModule } from './modulos/reportes/reportes.module';
import { ResenasModule } from './modulos/resenas/resenas.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          genReqId: (req) => (req.headers[CABECERA_CORRELACION] as string) || randomUUID(),
          customProps: (req) => ({ correlationId: req.id }),
        },
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: { headers: Record<string, unknown> }) =>
          (req.headers[CABECERA_CORRELACION] as string) || randomUUID(),
      },
      plugins: [
        new ClsPluginTransactional({
          imports: [PrismaModule],
          adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PrismaService }),
        }),
      ],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, CLIENTE_REDIS],
      useFactory: (config: ConfigService, redis: Redis) => ({
        throttlers: [{ ttl: 60_000, limit: Number(config.get('THROTTLE_LIMIT') ?? 120) }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('REDIS_URL'))],
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    RedisModule,
    PrismaModule,
    AuthCompartidoModule,
    EventosModule,
    MediaModule,
    SaludModule,
    RegistroModulosModule,
    UsuariosModule,
    CatalogoModule,
    InventarioModule,
    CarritoModule,
    ComplementariosModule,
    PedidosModule,
    PagosModule,
    NotificacionesModule,
    ResenasModule,
    ReportesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: FiltroExcepciones },
  ],
})
export class AppModule {}
