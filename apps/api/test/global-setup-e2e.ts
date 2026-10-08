import { execSync } from 'node:child_process';
import path from 'node:path';
import { startTestPostgres } from './testcontainers.helper';

const apiRoot = path.join(__dirname, '..');

/** Aplica migraciones antes de los e2e; Testcontainers solo si no hay DATABASE_URL. */
export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    const started = await startTestPostgres();
    if (started) {
      process.env.DATABASE_URL = started.databaseUrl;
      (globalThis as { __E2E_PG__?: unknown }).__E2E_PG__ = started.container;
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL es obligatoria para e2e (servicios de CI o Postgres local)');
  }
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://localhost:6379';
  }

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-key-must-be-at-least-32-chars';
  process.env.MEDIA_DRIVER = 'local';
  process.env.UPLOAD_DIR = '/tmp/me-e2e-uploads';
  process.env.PAYMENT_PROVIDER = 'mock';
  process.env.SWAGGER_ENABLED = 'false';
  process.env.TRABAJOS_PROGRAMADOS = 'false';
  process.env.THROTTLE_LIMIT = '10000';
  process.env.THROTTLE_AUTH_LIMIT = '1000';

  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    env: process.env,
    stdio: 'inherit',
  });
}
