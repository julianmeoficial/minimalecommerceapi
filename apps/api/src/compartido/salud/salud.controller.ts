import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorService, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import Redis from 'ioredis';
import { Publico } from '../auth/decoradores';
import { PrismaService } from '../prisma/prisma.service';
import { CLIENTE_REDIS } from '../redis/redis.module';

@ApiTags('salud')
@SkipThrottle()
@Publico()
@Controller({ path: 'salud', version: VERSION_NEUTRAL })
export class SaludController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly indicadores: HealthIndicatorService,
    private readonly prisma: PrismaService,
    @Inject(CLIENTE_REDIS) private readonly redis: Redis,
  ) {}

  /** Liveness: el proceso responde. No toca dependencias para no provocar reinicios en cascada. */
  @Get('vida')
  vida() {
    return { status: 'ok' };
  }

  /** Readiness: la instancia puede atender tráfico (Postgres y Redis disponibles). */
  @Get('listo')
  @HealthCheck()
  listo() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('postgres', this.prisma, { timeout: 2000 }),
      async () => {
        const indicador = this.indicadores.check('redis');
        try {
          await this.redis.ping();
          return indicador.up();
        } catch {
          return indicador.down();
        }
      },
    ]);
  }
}
