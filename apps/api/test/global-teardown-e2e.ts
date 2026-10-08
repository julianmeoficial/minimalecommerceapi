import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalTeardown() {
  const container = (globalThis as { __E2E_PG__?: StartedPostgreSqlContainer }).__E2E_PG__;
  if (container) await container.stop();
}
