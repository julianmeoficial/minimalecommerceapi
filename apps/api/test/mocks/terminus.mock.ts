import { Injectable, Module } from '@nestjs/common';

@Injectable()
export class HealthCheckService {
  check(checks: Array<() => Promise<unknown>>) {
    return Promise.all(checks.map((c) => c()));
  }
}

@Injectable()
export class PrismaHealthIndicator {
  pingCheck() {
    return Promise.resolve({ postgres: { status: 'up' } });
  }
}

@Injectable()
export class HealthIndicatorService {
  check() {
    return { up: () => ({ status: 'up' }), down: () => ({ status: 'down' }) };
  }
}

@Module({
  providers: [HealthCheckService, PrismaHealthIndicator, HealthIndicatorService],
  exports: [HealthCheckService, PrismaHealthIndicator, HealthIndicatorService],
})
export class TerminusModule {
  static forRoot() {
    return {
      module: TerminusModule,
      providers: [HealthCheckService, PrismaHealthIndicator, HealthIndicatorService],
      exports: [HealthCheckService, PrismaHealthIndicator, HealthIndicatorService],
    };
  }
}

export const HealthCheck = () => () => undefined;
