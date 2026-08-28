import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

/** Raíz de `apps/api` tanto en `src/` (watch) como en `dist/src/` (build). */
function apiRootFromMainModule(): string {
  return join(__dirname, '..', '..');
}

export function resolveHttpsOptions(env: {
  tlsEnabled?: string;
  tlsKeyPath?: string;
  tlsCertPath?: string;
}): HttpsOptions | undefined {
  const root = apiRootFromMainModule();
  const keyPath = env.tlsKeyPath ?? join(root, 'certs', 'localhost-key.pem');
  const certPath = env.tlsCertPath ?? join(root, 'certs', 'localhost.pem');
  const explicit = env.tlsEnabled === 'true';
  const hasCerts = existsSync(keyPath) && existsSync(certPath);

  if (!explicit && !hasCerts) {
    return undefined;
  }
  if (!existsSync(keyPath) || !existsSync(certPath)) {
    throw new Error(
      `TLS habilitado pero faltan certificados. Ejecuta: pnpm certs:dev (buscados en ${keyPath})`,
    );
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
}
