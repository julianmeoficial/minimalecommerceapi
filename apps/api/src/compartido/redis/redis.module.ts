import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CLIENTE_REDIS = Symbol('CLIENTE_REDIS');

@Global()
@Module({
  providers: [
    {
      provide: CLIENTE_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: 2, lazyConnect: false }),
    },
  ],
  exports: [CLIENTE_REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(CLIENTE_REDIS) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }
}
