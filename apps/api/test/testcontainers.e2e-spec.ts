import { startTestPostgres } from './testcontainers.helper';

describe('Testcontainers Postgres', () => {
  it('starts a disposable Postgres when Docker is available', async () => {
    const started = await startTestPostgres();
    if (!started) {
      console.warn('Docker no disponible: se omite Testcontainers (CI usa servicio postgres)');
      return;
    }
    expect(started.databaseUrl).toContain('postgres');
    await started.container.stop();
  }, 120_000);
});
