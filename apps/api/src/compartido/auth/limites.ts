import { Throttle } from '@nestjs/throttler';

/** Límite estricto para endpoints de credenciales (fuerza bruta y relleno de credenciales). */
export const LimiteCredenciales = () =>
  Throttle({ default: { limit: () => Number(process.env.THROTTLE_AUTH_LIMIT ?? 10), ttl: 60_000 } });
