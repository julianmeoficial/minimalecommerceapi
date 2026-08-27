import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

/**
 * Arranca Postgres vía Testcontainers cuando Docker está disponible.
 * En CI GitHub Actions se usa el servicio postgres del workflow (DATABASE_URL).
 */
export async function startTestPostgres(): Promise<{
  container: StartedPostgreSqlContainer;
  databaseUrl: string;
} | null> {
  try {
    const container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('minimalecommerce')
      .withUsername('app')
      .withPassword('change-me')
      .start();
    return {
      container,
      databaseUrl: container.getConnectionUri(),
    };
  } catch {
    return null;
  }
}
